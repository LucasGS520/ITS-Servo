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
