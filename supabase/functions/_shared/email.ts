/**
 * Envio de e-mail transacional via Resend.
 *
 * Decisão do projeto ("código pronto, chave depois"): se `RESEND_API_KEY` não
 * estiver configurada, a função apenas registra em log e NÃO falha o fluxo —
 * assim o resto continua funcionando até a chave existir.
 *
 * Secrets esperados (Supabase → Edge Functions → Secrets):
 *   RESEND_API_KEY   — chave da API Resend
 *   EMAIL_FROM       — remetente verificado, ex: "ITS Servo <no-reply@itsservo.org>"
 */
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

/**
 * @returns `true` se o e-mail foi de fato enviado; `false` quando o provider
 * não está configurado (RESEND_API_KEY ausente — modo "código pronto, chave
 * depois"). Falha de envio real lança. Callers NÃO devem reportar sucesso de
 * e-mail quando receberem `false`.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY ausente — e-mail NÃO enviado. to=${to} subject="${subject}"`);
    return false;
  }
  // Com a chave presente, remetente ausente é erro de configuração — enviar de
  // um domínio placeholder falharia no Resend de forma opaca.
  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM não configurado (remetente verificado, ex.: \"ITS Servo <no-reply@itsservo.org>\").");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend falhou (${res.status}): ${await res.text()}`);
  }
  return true;
}

/**
 * Layout simples e sóbrio, alinhado à marca (pergaminho/azul-marinho/ouro).
 * CÓPIA SINCRONIZADA dos tokens de packages/design-system/tokens.css — e-mail
 * não enxerga CSS do workspace: #f5f1e8=--paper, #fffdf8=--surface,
 * #e7ddc9=--line, #15223f=--navy-800, #f6e8c6=--gold-100, #14203a=--ink,
 * #b8862f=--gold-600. Rebrand na paleta → atualizar aqui também.
 */
export function baseTemplate(titulo: string, corpoHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f5f1e8;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e7ddc9;border-radius:14px;overflow:hidden">
      <div style="background:#15223f;color:#f6e8c6;padding:20px 24px;font-weight:bold;font-size:18px">Instituto Teológico Servo</div>
      <div style="padding:24px;color:#14203a;line-height:1.6">
        <h1 style="font-size:20px;margin:0 0 12px;color:#15223f">${titulo}</h1>
        ${corpoHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e7ddc9;color:#8b8f9c;font-size:12px">
        Este é um e-mail automático do ITS Servo. Em caso de dúvida, responda a esta mensagem.
      </div>
    </div>
  </div>`;
}

export function botao(href: string, texto: string): string {
  return `<a href="${href}" style="display:inline-block;background:#b8862f;color:#14203a;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px">${texto}</a>`;
}
