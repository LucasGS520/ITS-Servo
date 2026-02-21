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

    // Email logic prepared for integration with email service (e.g., Resend)
    // For now, just log the email that would be sent
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
