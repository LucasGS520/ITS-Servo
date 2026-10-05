import {
  buscarInscricao,
  cancelarInscricao,
  enviarComprovante,
  type InscricaoResumo,
} from "@its-servo/supabase";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";
import type { StatusInscricao } from "@/modules/matriculas/model";

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

export interface AtualizarStatusInscricaoInput {
  inscricao: Inscricao;
  status: StatusInscricao;
  motivo?: string;
}

export const atualizarStatusInscricao = async ({
  inscricao,
  status,
  motivo,
}: AtualizarStatusInscricaoInput): Promise<void> => {
  const { error } = await supabase.rpc("alterar_status_matricula", {
    p_inscricao_id: inscricao.id,
    p_status: status,
    p_motivo: motivo?.trim() || null,
  });

  if (error) throw error;
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
