/**
 * Edge function — enviar-comprovante  (CONTRATO: autosserviço, pós-inscrição)
 *
 * Recebe o comprovante (base64) e número, com token opcional para links antigos,
 * valida, sobe para o bucket
 * privado e delega a atualização da inscrição a uma RPC
 * transacional. Se a RPC falhar, remove o objeto recém-enviado.
 *
 * POST { numero, token?, file_base64, content_type }
 * → 200 { success: true }
 *
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/admin.ts";
import { sha256Hex } from "../_shared/token.ts";
import { limitarInteracaoInscricao } from "../_shared/inscricao-rate.ts";

const MAX_BYTES = 5 * 1024 * 1024;
// A extensão do objeto vem SEMPRE daqui (content_type validado), nunca do
// filename do cliente — que é insumo não confiável.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.includes(",") ? b64.split(",")[1] : b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function hasExpectedSignature(bytes: Uint8Array, contentType: string): boolean {
  switch (contentType) {
    case "image/jpeg":
      return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        hasPrefix(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]);
    case "application/pdf":
      return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    default:
      return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return json({}, 204, origin);
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  try {
    const { numero, token, file_base64, content_type } = await req.json();
    if (!numero || typeof file_base64 !== "string" || !file_base64) {
      return json({ error: "Dados incompletos." }, 400, origin);
    }
    if (!/^ITS\d{4}-\d{4,}$/.test(String(numero).trim().toUpperCase())) {
      return json({ error: "Número inválido." }, 400, origin);
    }
    if (!(content_type in ALLOWED)) return json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, 400, origin);

    // Rejeitar pelo TAMANHO DA STRING antes do atob: decodificar primeiro
    // permitiria a um anônimo alocar dezenas de MB na memória do worker.
    // base64 infla ~4/3, então 5MB ≈ 6,67M chars (+ margem de header/padding).
    if (file_base64.length > Math.ceil((MAX_BYTES * 4) / 3) + 2048) {
      return json({ error: "Arquivo muito grande (máx 5MB)." }, 400, origin);
    }

    const bytes = b64ToBytes(file_base64);
    if (bytes.byteLength > MAX_BYTES) return json({ error: "Arquivo muito grande (máx 5MB)." }, 400, origin);
    if (!hasExpectedSignature(bytes, content_type)) {
      return json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, 400, origin);
    }

    const admin = adminClient();
    if (!token && !await limitarInteracaoInscricao(admin, req, "comprovante", 5)) {
      return json({ error: "Limite de envios atingido." }, 429, origin);
    }

    // A RPC compara este hash com o persistido e registra apenas a evidência.
    const hash = token ? await sha256Hex(token) : null;
    const path = `${String(numero).trim().toUpperCase()}/${crypto.randomUUID()}.${ALLOWED[content_type]}`;
    const { error: upErr } = await admin.storage
      .from("comprovantes")
      .upload(path, bytes, { contentType: content_type, upsert: false });
    if (upErr) throw upErr;

    const { error: registroErr } = hash
      ? await admin.rpc("registrar_comprovante_operacional", {
        p_numero: numero, p_token_hash: hash, p_comprovante_path: path,
      })
      : await admin.rpc("registrar_comprovante_publico_its", {
        p_numero: String(numero).trim().toUpperCase(), p_comprovante_path: path,
      });
    if (registroErr) {
      const { error: cleanupErr } = await admin.storage.from("comprovantes").remove([path]);
      if (cleanupErr) console.error("enviar-comprovante: falha ao remover upload órfão:", cleanupErr);
      const negado = /n[aã]o encontrada|c[oó]digo de acesso/i.test(registroErr.message);
      const conflito = /estado invalido|status atual/i.test(registroErr.message);
      return json({ error: registroErr.message }, negado ? 403 : conflito ? 409 : 500, origin);
    }

    return json({ success: true }, 200, origin);
  } catch (e) {
    console.error("enviar-comprovante:", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500, origin);
  }
});
