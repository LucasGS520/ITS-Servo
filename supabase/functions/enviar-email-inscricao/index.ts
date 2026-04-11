/**
 * Função Edge Supabase — enviar-email-inscricao
 *
 * Descrição:
 *   Recebe dados de nova inscrição vindos do frontend e prepara o envio
 *   do e-mail de confirmação ao candidato.
 *
 * Entrada (JSON, método POST):
 *   {
 *     "numero_inscricao": string,
 *     "nome": string,
 *     "email": string
 *   }
 *
 * Resposta:
 *   - 200 JSON: { success: true, message: "Email queued (integration pending)" }
 *   - 500 JSON: { error: string }
 *
 * Responsabilidades:
 *   - Extrair e validar o payload JSON enviado pelo frontend.
 *   - Montar o conteúdo do e-mail de confirmação e registrar via logs.
 *   - Retornar resposta JSON adequada e habilitar CORS.
 *
 * Observações:
 *   - Executa no runtime Deno (importa o servidor HTTP do Deno).
 *   - Atualmente apenas realiza logging; integração com provedor de e-mail
 *     (ex.: Resend, SendGrid) e tratamento de retry devem ser implementados.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numero_inscricao, nome, email } = await req.json();
    // TODO: Integrar com provedor de e-mail (Resend/SendGrid) e implementar
    //       estratégia de retry/observabilidade. Atualmente apenas logamos
    //       o conteúdo que seria enviado.
    console.log("📧 E-mail de confirmação de inscrição:");
    console.log(`Para: ${email}`);
    console.log(`Assunto: Inscrição Recebida - ${numero_inscricao}`);
    console.log(`Corpo: Olá ${nome}, sua inscrição ${numero_inscricao} foi recebida com sucesso!`);
    console.log("Próximo passo: realizar o pagamento via PIX.");

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
