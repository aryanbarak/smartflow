import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawTarget = env.VITE_AI_AGENT_URL || "http://localhost:8000";
  const target = rawTarget.trim().replace(/\/+$/, "") || "http://localhost:8000";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/__ai": {
          target,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/__ai/, ""),
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/pdfjs-dist")) return "pdfjs";
            if (id.includes("node_modules/react-pdf")) return "react-pdf";
            if (id.includes("node_modules/recharts")) return "recharts";
            if (id.includes("node_modules/@supabase/supabase-js")) return "supabase";
            if (id.includes("node_modules/framer-motion")) return "framer-motion";
            if (id.includes("node_modules/@tanstack/react-query")) return "tanstack-query";
            if (id.includes("node_modules/pdf-lib")) return "pdf-lib";
          },
        },
      },
    },
  };
});
