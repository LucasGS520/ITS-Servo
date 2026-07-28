// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

/**
 * Guard de env no BUILD: PUBLIC_* é inlinado no bundle — env ausente ou com
 * placeholder passaria silenciosamente no build e só quebraria no submit do
 * formulário, na mão do usuário final.
 * (Parser próprio de .env: `vite` não é dependência direta deste app.)
 */
const lerEnv = () => {
  /** @type {Record<string, string>} */
  const env = {};
  try {
    for (const linha of readFileSync(new URL('./.env', import.meta.url), 'utf-8').split(/\r?\n/)) {
      const m = linha.match(/^\s*(PUBLIC_[A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {
    // sem .env — só process.env
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('PUBLIC_') && v) env[k] = v;
  }
  return env;
};

const envGuard = () => ({
  name: 'its-env-guard',
  hooks: {
    'astro:build:start': () => {
      const env = lerEnv();
      const obrigatorias = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'];
      const problemas = obrigatorias.filter((k) => {
        const v = env[k] ?? '';
        return !v || v.includes('COLE_A') || v.includes('placeholder');
      });
      if (problemas.length > 0) {
        throw new Error(
          `Build abortado: env ausente/placeholder: ${problemas.join(', ')}. ` +
            'Preencha apps/site/.env (ver .env.example).',
        );
      }
      if (!env.PUBLIC_CENTRAL_URL) {
        console.warn(
          '[its-env-guard] PUBLIC_CENTRAL_URL ausente: o pós-inscrição exibirá numero+token na página em vez de redirecionar para a Central.',
        );
      }
    },
  },
});

// https://astro.build/config
export default defineConfig({
  // site: 'https://itsservo.org',  // definir no deploy (Fase 6)
  integrations: [envGuard()],
});
