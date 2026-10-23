import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/admin.ts";
import { limitarInteracaoInscricao } from "../_shared/inscricao-rate.ts";

const numeroValido = (valor: string) => /^ITS\d{4}-\d{4,}$/.test(valor);

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return json({}, 204, origin);
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);
  try {
    const body = await req.json() as { acao?: string; identificador?: string; numero?: string };
    const admin = adminClient();
    if (body.acao === "buscar") {
      const entrada = String(body.identificador ?? "").trim().toUpperCase();
      const cpf = entrada.replace(/\D/g, "");
      if (!numeroValido(entrada) && cpf.length !== 11) return json({ error: "Informe CPF ou número válido" }, 400, origin);
      if (!await limitarInteracaoInscricao(admin, req, "consulta", 30)) return json({ error: "Limite de consultas atingido" }, 429, origin);
      const query = admin.from("inscricoes")
        .select("id,numero_inscricao,status,curso:cursos(nome),edicao:edicoes_simposio(nome)")
        .order("created_at", { ascending: false }).limit(30);
      const { data, error } = numeroValido(entrada) ? await query.eq("numero_inscricao", entrada) : await query.eq("cpf", cpf);
      if (error) throw error;
      const ids = (data ?? []).map((item) => item.id);
      const { data: pedidos, error: pedidosError } = ids.length
        ? await admin.from("solicitacoes_cancelamento_inscricao").select("inscricao_id").in("inscricao_id", ids).eq("status", "pendente")
        : { data: [], error: null };
      if (pedidosError) throw pedidosError;
      const pendentes = new Set((pedidos ?? []).map((item) => item.inscricao_id));
      return json({ inscricoes: (data ?? []).map((item) => ({
        numero_inscricao: item.numero_inscricao,
        atividade: (item.curso as { nome?: string } | null)?.nome ?? (item.edicao as { nome?: string } | null)?.nome ?? "Atividade ITS",
        status: item.status,
        cancelamento_pendente: pendentes.has(item.id),
      })) }, 200, origin);
    }
    if (body.acao === "solicitar_cancelamento") {
      const numero = String(body.numero ?? "").trim().toUpperCase();
      if (!numeroValido(numero)) return json({ error: "Número inválido" }, 400, origin);
      if (!await limitarInteracaoInscricao(admin, req, "cancelamento", 3)) return json({ error: "Limite de solicitações atingido" }, 429, origin);
      const { data: inscricao, error } = await admin.from("inscricoes").select("id,status")
        .eq("numero_inscricao", numero).maybeSingle();
      if (error) throw error;
      if (!inscricao || inscricao.status === "cancelado") return json({ error: "Inscrição indisponível" }, 409, origin);
      const { error: insertError } = await admin.from("solicitacoes_cancelamento_inscricao")
        .insert({ inscricao_id: inscricao.id });
      if (insertError) return json({ error: "Já existe uma solicitação pendente ou não foi possível registrar" }, 409, origin);
      return json({ solicitado: true }, 200, origin);
    }
    return json({ error: "Ação inválida" }, 400, origin);
  } catch (error) {
    console.error("inscricoes-publicas:", error);
    return json({ error: "Não foi possível concluir. Tente novamente." }, 500, origin);
  }
});
