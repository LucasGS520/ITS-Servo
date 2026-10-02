import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
/**
 * Configuração do Vitest (test runner):
 * - `environment: 'jsdom'` para testes que precisam de DOM (componentes React).
 * - `setupFiles` para inicializações/mocks globais antes dos testes.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
