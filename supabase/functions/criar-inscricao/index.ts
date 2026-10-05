/**
 * Edge function — criar-inscricao  (CONTRATO: entrada do funil)
 *
 * Ponto único pelo qual o Site Institucional envia uma solicitação à
 * Central. O contrato operacional valida no servidor, cria o registro via
 * service_role (RLS não expõe INSERT ao anon) e gera o token de autosserviço
 * (guarda só o hash) para o redirecionamento seguro à Central.
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
import { validateCPF } from "../_shared/cpf.ts";
import { NUCLEO_SLUGS } from "../_shared/nucleos.ts";

interface Dto {
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string; // yyyy-mm-dd
  escolaridade: string;
  modalidade: "presencial" | "correspondencia";
  nucleo?: string | null;
  destino?: "curso" | "simposio";
  curso_codigo?: "teologico" | "capacitacao_obreiros";
  edicao_simposio_id?: string | null;
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
  if (d.destino && !["curso", "simposio"].includes(d.destino)) return "Destino inválido.";
  if ((d.destino ?? "curso") === "curso" && d.curso_codigo && !["teologico", "capacitacao_obreiros"].includes(d.curso_codigo)) {
    return "Curso inválido.";
  }
  if ((d.destino ?? "curso") === "simposio" && !d.edicao_simposio_id) return "Selecione uma edição de simpósio.";
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
    if (hitsErr) {
      console.error("criar-inscricao: rate limit indisponível:", hitsErr);
      return json({ error: "Serviço temporariamente indisponível. Tente novamente em alguns minutos." }, 503, origin);
    }
    if ((hits ?? 0) >= 5) {
      return json({ error: "Muitas tentativas deste endereço. Tente novamente em 1 hora." }, 429, origin);
    }
    const { error: hitInsErr } = await admin.from("criar_inscricao_hits").insert({ ip });
    if (hitInsErr) {
      console.error("criar-inscricao: falha ao registrar hit:", hitInsErr);
      return json({ error: "Serviço temporariamente indisponível. Tente novamente em alguns minutos." }, 503, origin);
    }

    const destino = dto.destino ?? "curso";
    const cursoCodigo = dto.curso_codigo ?? "teologico";
    let cursoId: string | null = null;
    let edicaoId: string | null = null;
    let valor: number | null = null;
    let referente = "";
    let categoriaNome = "";
    if (destino === "curso") {
      const { data: curso } = await admin.from("cursos").select("id,nome,valor").eq("codigo", cursoCodigo).eq("ativo", true).eq("publico", true).maybeSingle();
      if (!curso) return json({ error: "Este curso não está disponível para inscrição." }, 409, origin);
      cursoId = curso.id;
      valor = curso.valor;
      referente = curso.nome;
      categoriaNome = curso.nome;
    } else {
      const { data: edicao } = await admin.from("edicoes_simposio").select("id,nome,valor").eq("id", dto.edicao_simposio_id!).eq("ativo", true).eq("publico", true).maybeSingle();
      if (!edicao) return json({ error: "Esta edição de simpósio não está disponível." }, 409, origin);
      edicaoId = edicao.id;
      valor = edicao.valor;
      referente = edicao.nome;
      categoriaNome = "Simpósio";
    }
    if (valor == null || valor <= 0) return json({ error: "O valor desta atividade ainda não foi configurado." }, 409, origin);

    // ---- Uma participação ativa por pessoa e destino ----
    const cpfLimpo = dto.cpf!.replace(/\D/g, "");
    const { data: pessoa, error: pessoaErr } = await admin
      .from("pessoas")
      .upsert({
        cpf: cpfLimpo, nome_completo: dto.nome_completo!.trim(), telefone: dto.telefone!.replace(/\D/g, ""),
        email: dto.email!.trim(), data_nascimento: dto.data_nascimento, escolaridade: dto.escolaridade,
      }, { onConflict: "cpf" })
      .select("id")
      .single();
    if (pessoaErr) throw pessoaErr;
    const { data: existente } = await admin
      .from("inscricoes")
      .select("id")
      .eq("pessoa_id", pessoa.id)
      .neq("status", "cancelado")
      .eq(destino === "curso" ? "curso_id" : "edicao_simposio_id", destino === "curso" ? cursoId : edicaoId)
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
        pessoa_id: pessoa.id,
        curso_id: cursoId,
        edicao_simposio_id: edicaoId,
        destino,
      })
      .select("id, numero_inscricao")
      .single();

    if (error) throw error;
    const numero = data.numero_inscricao as string;

    const { data: categoria, error: categoriaErr } = await admin
      .from("categorias_financeiras")
      .select("id")
      .eq("nome", categoriaNome)
      .eq("tipo", "entrada")
      .maybeSingle();
    if (categoriaErr || !categoria) throw categoriaErr ?? new Error("Categoria financeira não configurada.");

    const { error: cobrancaErr } = await admin.from("cobrancas").insert({
      pessoa_id: pessoa.id,
      inscricao_id: data.id,
      curso_id: cursoId,
      edicao_simposio_id: edicaoId,
      categoria_id: categoria.id,
      referente,
      valor_devido: valor,
    });
    if (cobrancaErr) throw cobrancaErr;

    return json({ numero_inscricao: numero, token }, 200, origin);
  } catch (e) {
    console.error("criar-inscricao:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
