/**
 * Função Edge Supabase — enviar-email-comprovante
 *
 * Descrição:
 *   Recebe notificação de envio de comprovante de pagamento e prepara as
 *   notificações ao administrador do ITS e ao próprio aluno.
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
 *   - Validar/extrair payload do frontend.
 *   - Notificar equipe administrativa e o aluno sobre o recebimento do
 *     comprovante (atualmente via logs).
 *   - Retornar resposta JSON e habilitar CORS para chamadas do cliente.
 *
 * Observações:
 *   - Implementação atual apenas registra logs; integração com provedor de
 *     e-mail deve ser adicionada em produção.
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
    // TODO: Integrar com provedor de e-mail (Resend/SendGrid) e adicionar
    //       logging/alertas adequados. Atualmente notificações são registradas
    //       apenas via console.log para auditoria.

    // Email para administração do ITS
    console.log("📧 Notificação ao ITS:");
    console.log(`Assunto: Novo comprovante recebido - ${numero_inscricao}`);
    console.log(`Corpo: O aluno ${nome} enviou o comprovante de pagamento para a inscrição ${numero_inscricao}.`);

    // Email para Estudante confirmando o recebimento do comprovante
    console.log("📧 E-mail ao aluno:");
    console.log(`Para: ${email}`);
    console.log(`Assunto: Comprovante Recebido - ${numero_inscricao}`);
    console.log(`Corpo: Olá ${nome}, recebemos seu comprovante de pagamento. Ele está em análise e você será notificado em breve.`);

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
