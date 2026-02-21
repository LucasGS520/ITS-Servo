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

    // Email to ITS admin
    console.log("📧 Notificação ao ITS:");
    console.log(`Assunto: Novo comprovante recebido - ${numero_inscricao}`);
    console.log(`Corpo: O aluno ${nome} enviou o comprovante de pagamento para a inscrição ${numero_inscricao}.`);

    // Email to student
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
