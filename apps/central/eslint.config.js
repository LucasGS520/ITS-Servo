/**
 * Configuração do ESLint usada pelo projeto.
 * - Regras e plugins para validação de arquivos `.ts`/`.tsx`.
 * - Plugins: `react-hooks`, `react-refresh` e regras recomendadas do TypeScript.
 * - Execute `npm run lint` para validar o código localmente.
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/App.tsx", "src/{layouts,pages,providers,routes,modules,common}/**/*.{ts,tsx}"],
    ignores: ["src/modules/**/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/services/supabase/client",
              message: "A UI deve acessar o Supabase pela API da feature.",
            },
          ],
        },
      ],
    },
  },
);
