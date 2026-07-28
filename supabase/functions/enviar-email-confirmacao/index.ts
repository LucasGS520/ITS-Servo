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
import { json } from "../_shared/cors.ts";
import { sendEmail, baseTemplate } from "../_shared/email.ts";
import { callerClient } from "../_shared/admin.ts";
import { NUCLEO_LABELS } from "../_shared/nucleos.ts";

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const { data, error } = await callerClient(authHeader).rpc("is_admin");
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
        ? `Suas aulas serão no núcleo: <strong>${NUCLEO_LABELS[nucleo] ?? nucleo}</strong>. Em breve você receberá os horários.`
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
