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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("@radix-ui") || id.includes("react") || id.includes("scheduler")) return "react-ui";
          return "vendor";
        },
      },
    },
  },
}));
