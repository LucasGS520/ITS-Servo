import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Contrato de dados da plataforma. Único ponto de acesso à inscrição —
 * nenhum app fala com a tabela `inscricoes` diretamente. Ver docs/arquitetura.md §5.
 */

export interface InscricaoDTO {
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string; // yyyy-mm-dd
  escolaridade: string;
  modalidade: "presencial" | "correspondencia";
  nucleo?: string | null;
}

export interface InscricaoResumo {
  numero_inscricao: string;
  nome_completo: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  escolaridade: string;
  modalidade: string;
  nucleo: string | null;
  status: string;
  comprovante_url: string | null;
  created_at: string;
}

/**
 * Erros de edge function chegam como FunctionsHttpError genérico ("non-2xx");
 * a mensagem real ({ error }) fica no Response em `error.context`. Sem isso,
 * todo 400/403/409 vira um toast opaco para o usuário.
 */
async function comMensagemDoServidor(error: unknown): Promise<never> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.clone === "function") {
    const body = await ctx.clone().json().catch(() => null);
    if (body && typeof body.error === "string" && body.error) {
      throw new Error(body.error);
    }
  }
  throw error;
}

/** Site → cria a inscrição. Retorna o número e o token de autosserviço (mostrar/guardar uma vez). */
export async function criarInscricao(
  client: SupabaseClient,
  dto: InscricaoDTO,
): Promise<{ numero_inscricao: string; token: string }> {
  const { data, error } = await client.functions.invoke("criar-inscricao", { body: dto });
  if (error) await comMensagemDoServidor(error);
  return data as { numero_inscricao: string; token: string };
}

/** Autosserviço → lê a própria inscrição mediante token (RPC SECURITY DEFINER). */
export async function buscarInscricao(
  client: SupabaseClient,
  numero: string,
  token: string,
): Promise<InscricaoResumo | null> {
  const { data, error } = await client.rpc("buscar_inscricao", { p_numero: numero, p_token: token });
  if (error) throw error;
  const rows = (data as InscricaoResumo[] | null) ?? [];
  return rows.length ? rows[0] : null;
}

/** Autosserviço → cancela a própria inscrição pendente mediante token (RPC). */
export async function cancelarInscricao(
  client: SupabaseClient,
  numero: string,
  token: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("cancelar_inscricao", { p_numero: numero, p_token: token });
  if (error) throw error;
  return data === true;
}

/** Autosserviço → envia comprovante (upload em bucket privado via edge). */
export async function enviarComprovante(
  client: SupabaseClient,
  params: { numero: string; token: string; file: File },
): Promise<void> {
  const file_base64 = await fileToBase64(params.file);
  const { error } = await client.functions.invoke("enviar-comprovante", {
    body: {
      numero: params.numero,
      token: params.token,
      file_base64,
      content_type: params.file.type,
    },
  });
  if (error) await comMensagemDoServidor(error);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
