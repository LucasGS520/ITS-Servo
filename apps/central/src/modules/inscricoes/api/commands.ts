import {
  buscarInscricao,
  cancelarInscricao,
  enviarComprovante,
  type InscricaoResumo,
} from "@its-servo/supabase";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";
import type { StatusInscricao } from "@/modules/inscricoes/model";

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
}

export interface AtualizarStatusInscricaoResult {
  emailConfirmacaoFalhou: boolean;
}

export const atualizarStatusInscricao = async ({
  inscricao,
  status,
}: AtualizarStatusInscricaoInput): Promise<AtualizarStatusInscricaoResult> => {
  const { error } = await supabase
    .from("inscricoes")
    .update({ status })
    .eq("id", inscricao.id);

  if (error) throw error;
  if (status !== "confirmada") return { emailConfirmacaoFalhou: false };

  try {
    const { error: emailError } = await supabase.functions.invoke(
      "enviar-email-confirmacao",
      {
        body: {
          numero_inscricao: inscricao.numero_inscricao,
          nome: inscricao.nome_completo,
          email: inscricao.email,
          modalidade: inscricao.modalidade,
          nucleo: inscricao.nucleo,
        },
      },
    );

    return { emailConfirmacaoFalhou: Boolean(emailError) };
  } catch {
    return { emailConfirmacaoFalhou: true };
  }
};

export type { InscricaoResumo };
