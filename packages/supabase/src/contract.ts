import type { SupabaseClient } from "./client.ts";

/**
 * Contrato público de inscrição da plataforma. O Site usa esta fronteira para
 * solicitar uma inscrição; a Central é dona do ciclo de vida operacional.
 * Acesso público nunca fala diretamente com `inscricoes`. Consultas administrativas
 * autenticadas continuam protegidas por RLS.
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
  /** Curso escolhido ou edição pública de simpósio. O fluxo legado assume Curso Teológico. */
  destino?: "curso" | "simposio";
  curso_codigo?: "teologico" | "capacitacao_obreiros";
  edicao_simposio_id?: string | null;
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
  destino: "curso" | "simposio";
  destino_nome: string | null;
  valor_devido: number | null;
  valor_pago: number;
  saldo_devedor: number | null;
}

export interface InscricaoPublica {
  numero_inscricao: string;
  atividade: string;
  status: string;
  cancelamento_pendente: boolean;
}

export async function consultarInscricoesPublicas(client: SupabaseClient, identificador: string): Promise<InscricaoPublica[]> {
  const { data, error } = await client.functions.invoke("inscricoes-publicas", {
    body: { acao: "buscar", identificador: identificador.trim() },
  });
  if (error) await comMensagemDoServidor(error);
  return (data as { inscricoes: InscricaoPublica[] }).inscricoes;
}

export async function solicitarCancelamentoPublico(client: SupabaseClient, numero: string): Promise<void> {
  const { error } = await client.functions.invoke("inscricoes-publicas", {
    body: { acao: "solicitar_cancelamento", numero },
  });
  if (error) await comMensagemDoServidor(error);
}

export type DestinoPublico =
  | { id: string; tipo: "curso"; codigo: "teologico" | "capacitacao_obreiros"; nome: string; taxa_matricula: number; mensalidade_referencia: number }
  | { id: string; tipo: "simposio"; nome: string; valor: number | null };

export interface NucleoPublico {
  slug: string;
  nome: string;
  cidade: string;
  uf: string;
}

export async function listarNucleosPublicos(client: SupabaseClient): Promise<NucleoPublico[]> {
  const { data, error } = await client.from("nucleos").select("slug,nome,cidade,uf").eq("ativo", true).order("nome");
  if (error) throw error;
  return (data ?? []) as NucleoPublico[];
}

/** Catálogo mínimo e seguro para o Site: só devolve cursos e edições publicados. */
export async function listarDestinosPublicos(client: SupabaseClient): Promise<DestinoPublico[]> {
  const [cursos, edicoes] = await Promise.all([
    client.from("cursos").select("id,codigo,nome,taxa_matricula,mensalidade_referencia").eq("ativo", true).eq("publico", true),
    client.from("edicoes_simposio").select("id,nome,valor").eq("ativo", true).eq("publico", true),
  ]);
  if (cursos.error) throw cursos.error;
  if (edicoes.error) throw edicoes.error;
  return [
    ...(cursos.data ?? []).filter((curso) => curso.taxa_matricula != null && curso.mensalidade_referencia != null).map((curso) => ({
      id: curso.id, tipo: "curso" as const, codigo: curso.codigo as "teologico" | "capacitacao_obreiros",
      nome: curso.nome, taxa_matricula: Number(curso.taxa_matricula), mensalidade_referencia: Number(curso.mensalidade_referencia),
    })),
    ...(edicoes.data ?? []).map((edicao) => ({ id: edicao.id, tipo: "simposio" as const, nome: edicao.nome, valor: edicao.valor })),
  ];
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

/**
 * Site → solicita uma inscrição à Central. Retorna somente o necessário para
 * encaminhar o candidato ao autosserviço; o registro e seu estado pertencem
 * ao backend operacional.
 */
export async function solicitarInscricao(
  client: SupabaseClient,
  dto: InscricaoDTO,
): Promise<{ numero_inscricao: string; token: string }> {
  const { data, error } = await client.functions.invoke("criar-inscricao", { body: dto });
  if (error) await comMensagemDoServidor(error);
  return data as { numero_inscricao: string; token: string };
}

/** @deprecated Use `solicitarInscricao`, que explicita a fronteira Site → Central. */
export const criarInscricao = solicitarInscricao;

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

/** Autosserviço → envia comprovante (upload em bucket privado via edge). */
export async function enviarComprovante(
  client: SupabaseClient,
  params: { numero: string; token?: string; file: File },
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
