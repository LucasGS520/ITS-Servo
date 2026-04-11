import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
/**
 * Configuração do Vite para desenvolvimento e build.
 * - Define servidor de desenvolvimento (host/porta) e HMR.
 * - Registra plugins (React SWC e tagger em `development`).
 * - Resolve alias `@` para `./src` facilitando imports absolutos.
 */
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
