/**
 * Edge function — enviar-email-confirmacao (disparada pela Central, admin)
 *
 * Notifica o candidato que a matrícula foi confirmada. Só um admin pode chamar:
 * valida o papel via JWT do chamador (rpc is_admin).
 *
 * POST { numero_inscricao, nome, email, modalidade, nucleo? }
 * → 200 { success: true }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { json } from "../_shared/cors.ts";
import { sendEmail, baseTemplate } from "../_shared/email.ts";

const nucleoInfo: Record<string, string> = {
  sede_jd_santa_monica: "Sede Jd. Santa Mônica — Barueri/SP",
  engenho_novo: "Engenho Novo — Barueri/SP",
  jd_conceicao: "Jd. Conceição — Osasco/SP",
  ariston: "Ariston — Carapicuíba/SP",
  maputo: "Maputo — Moçambique",
};

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.rpc("is_admin");
  return !error && data === true;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return json({}, 204, origin);
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  try {
    if (!(await isAdmin(req.headers.get("Authorization")))) {
      return json({ error: "Acesso não autorizado." }, 403, origin);
    }

    const { numero_inscricao, nome, email, modalidade, nucleo } = await req.json();
    if (!numero_inscricao || !email) return json({ error: "Dados incompletos." }, 400, origin);

    const detalhe =
      modalidade === "presencial" && nucleo
        ? `Suas aulas serão no núcleo: <strong>${nucleoInfo[nucleo] ?? nucleo}</strong>. Em breve você receberá os horários.`
        : "Você receberá o material por correspondência. Aguarde as instruções de envio.";

    await sendEmail(
      email,
      `Matrícula confirmada — ${numero_inscricao}`,
      baseTemplate(
        `Parabéns, ${String(nome ?? "").split(" ")[0] || "aluno(a)"}!`,
        `<p>Sua matrícula (<strong>${numero_inscricao}</strong>) foi <strong>confirmada</strong>. Bem-vindo(a) ao Instituto Teológico Servo!</p>
         <p>${detalhe}</p>`,
      ),
    );

    return json({ success: true }, 200, origin);
  } catch (e) {
    console.error("enviar-email-confirmacao:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
