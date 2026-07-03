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

const SELF_SERVICE_URL = Deno.env.get("SELF_SERVICE_URL") ?? "http://localhost:5173";

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
  if (!d.cpf || d.cpf.replace(/\D/g, "").length !== 11) return "CPF inválido.";
  if (!d.telefone || d.telefone.replace(/\D/g, "").length < 10) return "Telefone inválido.";
  if (!d.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return "E-mail inválido.";
  if (!d.data_nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(d.data_nascimento)) return "Data de nascimento inválida.";
  if (!d.escolaridade) return "Escolaridade obrigatória.";
  if (d.modalidade !== "presencial" && d.modalidade !== "correspondencia") return "Modalidade inválida.";
  if (d.modalidade === "presencial" && !d.nucleo) return "Selecione o núcleo para modalidade presencial.";
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

    const token = generateToken();
    const consulta_token_hash = await sha256Hex(token);

    const admin = adminClient();
    const { data, error } = await admin
      .from("inscricoes")
      .insert({
        nome_completo: dto.nome_completo!.trim(),
        cpf: dto.cpf!.replace(/\D/g, ""),
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

    const link = `${SELF_SERVICE_URL}/inscricao/${numero}?token=${token}`;
    await sendEmail(
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

    return json({ numero_inscricao: numero, token }, 200, origin);
  } catch (e) {
    console.error("criar-inscricao:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
