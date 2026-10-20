/**
 * Edge function — criar-inscricao  (CONTRATO: entrada do funil)
 *
 * Ponto único pelo qual o Site Institucional envia uma solicitação à
 * Central. O contrato operacional valida no servidor, gera o token de
 * autosserviço e delega a criação de pessoa + inscrição a uma RPC
 * transacional. O banco guarda somente o hash do token.
 *
 * POST { nome_completo, cpf, telefone, email, data_nascimento, escolaridade,
 *        modalidade, nucleo? }
 * → 200 { numero_inscricao, token }
 *
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/admin.ts";
import { generateToken, sha256Hex } from "../_shared/token.ts";
import { validateCPF } from "../_shared/cpf.ts";

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
  if (d.modalidade === "presencial" && !d.nucleo) {
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
    if (dto.modalidade === "presencial") {
      const { data: nucleo, error: nucleoError } = await admin
        .from("nucleos").select("id").eq("slug", dto.nucleo!).eq("ativo", true).maybeSingle();
      if (nucleoError || !nucleo) return json({ error: "Selecione um núcleo ativo e válido para modalidade presencial." }, 400, origin);
    }

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
    const cpfLimpo = dto.cpf!.replace(/\D/g, "");
    const token = generateToken();
    const consulta_token_hash = await sha256Hex(token);
    const { data, error } = await admin.rpc("criar_matricula_operacional", {
      p_nome_completo: dto.nome_completo!.trim(),
      p_cpf: cpfLimpo,
      p_telefone: dto.telefone!.replace(/\D/g, ""),
      p_email: dto.email!.trim(),
      p_data_nascimento: dto.data_nascimento,
      p_escolaridade: dto.escolaridade,
      p_modalidade: dto.modalidade,
      p_nucleo: dto.modalidade === "presencial" ? dto.nucleo : null,
      p_destino: destino,
      p_curso_codigo: destino === "curso" ? cursoCodigo : null,
      p_edicao_simposio_id: destino === "simposio" ? dto.edicao_simposio_id : null,
      p_consulta_token_hash: consulta_token_hash,
    });
    if (error) {
      const conflito = /j[aá] existe|n[aã]o est[aá] dispon[ií]vel|duplicat/i.test(error.message);
      return json({ error: error.message }, conflito ? 409 : 500, origin);
    }
    const criada = Array.isArray(data) ? data[0] : data;
    if (!criada?.numero_inscricao) throw new Error("A matrícula não retornou um número válido.");

    return json({ numero_inscricao: criada.numero_inscricao, token }, 200, origin);
  } catch (e) {
    console.error("criar-inscricao:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
