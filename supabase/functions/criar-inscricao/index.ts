/**
 * Edge function — criar-inscricao  (CONTRATO: entrada do funil)
 *
 * Ponto único pelo qual o Site Institucional cria uma inscrição. Valida no
 * servidor, insere via service_role (RLS não expõe INSERT ao anon), gera o
 * token de autosserviço (guarda só o hash) e dispara o e-mail com o link
 * mágico para a superfície de autosserviço da Central.
 *
 * POST { nome_completo, cpf, telefone, email, data_nascimento, escolaridade,
 *        modalidade, nucleo? }
 * → 200 { numero_inscricao, token }
 *
 * Ver docs/arquitetura.md §5.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/admin.ts";
import { generateToken, sha256Hex } from "../_shared/token.ts";
import { sendEmail, baseTemplate, botao } from "../_shared/email.ts";
import { validateCPF } from "../_shared/cpf.ts";
import { NUCLEO_SLUGS } from "../_shared/nucleos.ts";

// Sem fallback silencioso: link mágico apontando para localhost em produção é
// pior do que falhar o deploy com mensagem clara.
const SELF_SERVICE_URL = Deno.env.get("SELF_SERVICE_URL");
if (!SELF_SERVICE_URL) {
  throw new Error("SELF_SERVICE_URL não configurada (ex.: https://central.itsservo.org). Defina via `supabase secrets set`.");
}

interface Dto {
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string; // yyyy-mm-dd
  escolaridade: string;
  modalidade: "presencial" | "correspondencia";
  nucleo?: string | null;
}

function validar(d: Partial<Dto>): string | null {
  if (!d.nome_completo || d.nome_completo.trim().length < 3) return "Nome inválido.";
  if (!d.cpf || !validateCPF(d.cpf)) return "CPF inválido.";
  if (!d.telefone || d.telefone.replace(/\D/g, "").length < 10) return "Telefone inválido.";
  if (!d.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return "E-mail inválido.";
  if (!d.data_nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(d.data_nascimento)) return "Data de nascimento inválida.";
  if (!d.escolaridade) return "Escolaridade obrigatória.";
  if (d.modalidade !== "presencial" && d.modalidade !== "correspondencia") return "Modalidade inválida.";
  if (d.modalidade === "presencial" && (!d.nucleo || !NUCLEO_SLUGS.includes(d.nucleo))) {
    return "Selecione um núcleo válido para modalidade presencial.";
  }
  return null;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return json({}, 204, origin);
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  try {
    const dto = (await req.json()) as Partial<Dto>;
    const erro = validar(dto);
    if (erro) return json({ error: erro }, 400, origin);

    const admin = adminClient();

    // ---- Rate limit por IP (janela de 1h, endpoint público) ----
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      "desconhecido";
    const janela = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await admin.from("criar_inscricao_hits").delete().lt("created_at", janela);
    const { count: hits, error: hitsErr } = await admin
      .from("criar_inscricao_hits")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", janela);
    // Guard degrada aberto (inscrição > rate limit), mas NUNCA em silêncio.
    if (hitsErr) console.error("criar-inscricao: rate limit indisponível:", hitsErr);
    if ((hits ?? 0) >= 5) {
      return json({ error: "Muitas tentativas deste endereço. Tente novamente em 1 hora." }, 429, origin);
    }
    const { error: hitInsErr } = await admin.from("criar_inscricao_hits").insert({ ip });
    if (hitInsErr) console.error("criar-inscricao: falha ao registrar hit:", hitInsErr);

    // ---- Uma inscrição ativa por CPF ----
    const cpfLimpo = dto.cpf!.replace(/\D/g, "");
    const { data: existente } = await admin
      .from("inscricoes")
      .select("id")
      .eq("cpf", cpfLimpo)
      .neq("status", "cancelado")
      .limit(1)
      .maybeSingle();
    if (existente) {
      return json(
        { error: "Já existe uma inscrição ativa para este CPF. Use o link do e-mail ou a página de consulta para acompanhá-la." },
        409,
        origin,
      );
    }

    const token = generateToken();
    const consulta_token_hash = await sha256Hex(token);

    const { data, error } = await admin
      .from("inscricoes")
      .insert({
        nome_completo: dto.nome_completo!.trim(),
        cpf: cpfLimpo,
        telefone: dto.telefone!.replace(/\D/g, ""),
        email: dto.email!.trim(),
        data_nascimento: dto.data_nascimento,
        escolaridade: dto.escolaridade,
        modalidade: dto.modalidade,
        nucleo: dto.modalidade === "presencial" ? dto.nucleo : null,
        consulta_token_hash,
      })
      .select("numero_inscricao")
      .single();

    if (error) throw error;
    const numero = data.numero_inscricao as string;

    // A inscrição já está persistida: falha de e-mail não pode derrubar a resposta,
    // senão o usuário resubmete e cria duplicata sem nunca receber numero/token.
    // Token no FRAGMENT (#): não trafega em Referer nem em logs de servidor.
    const link = `${SELF_SERVICE_URL}/inscricao/pagamento/${numero}#token=${token}`;
    let email_enviado = false;
    try {
      email_enviado = await sendEmail(
        dto.email!.trim(),
        `Inscrição recebida — ${numero}`,
        baseTemplate(
          `Olá, ${dto.nome_completo!.split(" ")[0]}!`,
          `<p>Sua inscrição <strong>${numero}</strong> foi recebida com sucesso.</p>
           <p>Para concluir, realize o pagamento e envie o comprovante nesta página segura:</p>
           <p style="margin:20px 0">${botao(link, "Acessar minha inscrição")}</p>
           <p style="font-size:13px;color:#5b6478">Guarde este link — é o acesso exclusivo à sua inscrição. Não o compartilhe.</p>`,
        ),
      );
    } catch (emailErr) {
      console.error("criar-inscricao: falha ao enviar e-mail de confirmação:", emailErr);
    }

    return json({ numero_inscricao: numero, token, email_enviado }, 200, origin);
  } catch (e) {
    console.error("criar-inscricao:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
