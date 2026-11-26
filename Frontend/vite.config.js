import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (id.includes("@reduxjs") || id.includes("redux")) {
              return "vendor-redux";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("socket.io-client") || id.includes("axios")) {
              return "vendor-network";
            }
            if (id.includes("i18next")) {
              return "vendor-i18n";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
