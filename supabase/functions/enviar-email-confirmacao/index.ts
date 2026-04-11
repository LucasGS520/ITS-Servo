/**
 * Função Edge Supabase — enviar-email-confirmacao
 *
 * Descrição:
 *   Envia (prepara) o e-mail oficial de confirmação de matrícula após o
 *   pagamento/comprovação do comprovante. Inclui instruções diferentes para
 *   modalidades presenciais e por correspondência.
 *
 * Entrada (JSON, método POST):
 *   {
 *     "numero_inscricao": string,
 *     "nome": string,
 *     "email": string,
 *     "modalidade": "presencial" | "correspondencia",
 *     "nucleo"?: string
 *   }
 *
 * Resposta:
 *   - 200 JSON: { success: true, message: "Email queued (integration pending)" }
 *   - 500 JSON: { error: string }
 *
 * Responsabilidades:
 *   - Montar instruções específicas conforme a modalidade e núcleo escolhido.
 *   - Registrar (log) o conteúdo do e-mail que será enviado.
 *   - Garantir CORS e retornar status adequado ao frontend.
 *
 * Observações:
 *   - Mapeamento de núcleos presente em `nucleoInfo`.
 *   - Integração com provedor de e-mail e registros persistentes devem ser
 *     implementados em produção; hoje apenas fazemos logging.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const nucleoInfo: Record<string, string> = {
  sede_jd_santa_monica: "Sede Jd. Santa Mônica - Barueri/SP",
  engenho_novo: "Engenho Novo - Barueri/SP",
  jd_conceicao: "Jd. Conceição - Osasco/SP",
  ariston: "Ariston - Carapicuíba/SP",
  maputo: "Maputo - Moçambique",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numero_inscricao, nome, email, modalidade, nucleo } = await req.json();
    // TODO: Integrar com provedor de e-mail (Resend/SendGrid) e registrar
    //       envios em sistema de observabilidade. Atualmente o e-mail é apenas
    //       escrito nos logs para controle.

    let instrucoes = "";
    if (modalidade === "presencial" && nucleo) {
      instrucoes = `Suas aulas serão no núcleo: ${nucleoInfo[nucleo] || nucleo}. Entre em contato para saber os horários das aulas.`;
    } else {
      instrucoes = "Você receberá o material por correspondência. Aguarde as instruções de envio/retirada.";
    }

    console.log("📧 E-mail de confirmação oficial:");
    console.log(`Para: ${email}`);
    console.log(`Assunto: Matrícula Confirmada! - ${numero_inscricao}`);
    console.log(`Corpo: Parabéns ${nome}! Sua matrícula ${numero_inscricao} foi confirmada!`);
    console.log(`Instruções: ${instrucoes}`);
    console.log("Para dúvidas, entre em contato pelo telefone/WhatsApp do ITS.");

    return new Response(
      JSON.stringify({ success: true, message: "Email queued (integration pending)" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
