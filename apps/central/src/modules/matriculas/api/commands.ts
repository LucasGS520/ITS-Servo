import {
  buscarInscricao,
  cancelarInscricao,
  enviarComprovante,
  type InscricaoResumo,
} from "@its-servo/supabase";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";

export type Inscricao = Tables<"inscricoes">;

const normalizarNumero = (numero: string) => numero.trim().toUpperCase();
const normalizarToken = (token: string) => token.trim();

export const consultarInscricao = (numero: string, token: string) =>
  buscarInscricao(supabase, normalizarNumero(numero), normalizarToken(token));

export const cancelarInscricaoAutosservico = (numero: string, token: string) =>
  cancelarInscricao(supabase, normalizarNumero(numero), normalizarToken(token));

export const enviarComprovanteInscricao = (
  numero: string,
  token: string,
  file: File,
) => enviarComprovante(supabase, {
  numero: normalizarNumero(numero),
  token: normalizarToken(token),
  file,
});

export const obterUrlComprovante = async (comprovanteUrl: string) => {
  if (/^https?:\/\//.test(comprovanteUrl)) return comprovanteUrl;

  const { data, error } = await supabase.storage
    .from("comprovantes")
    .createSignedUrl(comprovanteUrl, 600);

  if (error) throw error;
  return data.signedUrl;
};

export const atualizarDadosAtendimento = async ({
  inscricaoId, nomeCompleto, telefone, email, dataNascimento, escolaridade,
}: { inscricaoId: string; nomeCompleto: string; telefone: string; email: string; dataNascimento: string; escolaridade: string }) => {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
  const { error } = await rpc("atualizar_atendimento", {
    p_inscricao_id: inscricaoId, p_nome_completo: nomeCompleto, p_telefone: telefone,
    p_email: email, p_data_nascimento: dataNascimento, p_escolaridade: escolaridade,
    p_motivo: "Correção via Atendimento",
  });
  if (error) throw error;
};

export type { InscricaoResumo };

const itsRpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;

export async function criarInscricaoInterna(values: {
  nome: string; cpf: string; telefone: string; email: string; nascimento: string;
  escolaridade: string; modalidade: string; nucleo: string | null;
  cursoId: string | null; edicaoId: string | null;
}) {
  const { error } = await itsRpc("criar_inscricao_interna", {
    p_nome: values.nome, p_cpf: values.cpf, p_telefone: values.telefone,
    p_email: values.email, p_nascimento: values.nascimento,
    p_escolaridade: values.escolaridade, p_modalidade: values.modalidade,
    p_nucleo: values.nucleo, p_curso_id: values.cursoId, p_edicao_id: values.edicaoId,
  });
  if (error) throw error;
}

export async function confirmarInscricaoIts(id: string, primeiraCompetencia: string | null, isento: boolean, motivo: string | null) {
  const { error } = await itsRpc("confirmar_inscricao_its", {
    p_inscricao_id: id, p_primeira_competencia: primeiraCompetencia,
    p_isento: isento, p_motivo: motivo,
  });
  if (error) throw error;
}

export async function cancelarInscricaoInterna(id: string, motivo: string) {
  const { error } = await itsRpc("cancelar_inscricao_interna", { p_inscricao_id: id, p_motivo: motivo });
  if (error) throw error;
}
