/**
 * Edge function — enviar-comprovante  (CONTRATO: autosserviço, pós-inscrição)
 *
 * Recebe o comprovante (base64) + token de posse, valida, sobe para o bucket
 * PRIVADO via service_role, atualiza status e notifica. O arquivo nunca fica
 * público — a Central lê depois por signed URL.
 *
 * POST { numero, token, file_base64, filename, content_type }
 * → 200 { success: true, status: "comprovante_enviado" }
 *
 * Ver docs/arquitetura.md §5.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/admin.ts";
import { sha256Hex } from "../_shared/token.ts";
import { sendEmail, baseTemplate } from "../_shared/email.ts";

const MAX_BYTES = 5 * 1024 * 1024;
// A extensão do objeto vem SEMPRE daqui (content_type validado), nunca do
// filename do cliente — que é insumo não confiável.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Opcional: e-mail da equipe para ser avisada de novos comprovantes.
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.includes(",") ? b64.split(",")[1] : b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return json({}, 204, origin);
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  try {
    const { numero, token, file_base64, content_type } = await req.json();
    if (!numero || !token || !file_base64) return json({ error: "Dados incompletos." }, 400, origin);
    if (!(content_type in ALLOWED)) return json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, 400, origin);

    const bytes = b64ToBytes(file_base64);
    if (bytes.byteLength > MAX_BYTES) return json({ error: "Arquivo muito grande (máx 5MB)." }, 400, origin);

    const admin = adminClient();

    // Verifica posse (token) e estado atual
    const hash = await sha256Hex(token);
    const { data: insc, error: findErr } = await admin
      .from("inscricoes")
      .select("id, nome_completo, email, status, consulta_token_hash")
      .eq("numero_inscricao", numero)
      .single();
    if (findErr || !insc) return json({ error: "Inscrição não encontrada." }, 404, origin);
    if (insc.consulta_token_hash !== hash) return json({ error: "Acesso não autorizado." }, 403, origin);
    if (!["aguardando_pagamento", "pagamento_nao_identificado"].includes(insc.status)) {
      return json({ error: `Não é possível enviar comprovante no status atual (${insc.status}).` }, 409, origin);
    }

    const path = `${numero}/${Date.now()}.${ALLOWED[content_type]}`;
    const { error: upErr } = await admin.storage
      .from("comprovantes")
      .upload(path, bytes, { contentType: content_type, upsert: false });
    if (upErr) throw upErr;

    const { error: updErr } = await admin
      .from("inscricoes")
      .update({ comprovante_url: path, status: "comprovante_enviado" })
      .eq("id", insc.id);
    if (updErr) throw updErr;

    // Upload e status já persistidos: falha de e-mail não derruba a resposta.
    try {
      await sendEmail(
        insc.email,
        `Comprovante recebido — ${numero}`,
        baseTemplate(
          "Comprovante recebido",
          `<p>Recebemos o comprovante da inscrição <strong>${numero}</strong>.</p>
           <p>Seu pagamento está <strong>em análise</strong>. Você receberá a confirmação por e-mail em breve.</p>`,
        ),
      );
    } catch (emailErr) {
      console.error("enviar-comprovante: falha no e-mail ao aluno:", emailErr);
    }

    // Aviso à equipe do ITS — sem isso os comprovantes ficam parados até
    // alguém abrir o painel por conta própria.
    if (ADMIN_EMAIL) {
      try {
        await sendEmail(
          ADMIN_EMAIL,
          `Novo comprovante recebido — ${numero}`,
          baseTemplate(
            "Novo comprovante para análise",
            `<p>${insc.nome_completo} enviou o comprovante de pagamento da inscrição <strong>${numero}</strong>.</p>
             <p>Acesse o painel da Central para analisar e confirmar.</p>`,
          ),
        );
      } catch (emailErr) {
        console.error("enviar-comprovante: falha na notificação ao ITS:", emailErr);
      }
    } else {
      console.warn("enviar-comprovante: ADMIN_EMAIL não configurado — equipe não notificada.");
    }

    return json({ success: true, status: "comprovante_enviado" }, 200, origin);
  } catch (e) {
    console.error("enviar-comprovante:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
