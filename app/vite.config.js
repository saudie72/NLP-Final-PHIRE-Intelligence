import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  worker: { format: "es" },
  // assetsInlineLimit 0: emit fonts and images as files so the strict CSP (font-src 'self') holds
  build: { target: "es2022", chunkSizeWarningLimit: 900, assetsInlineLimit: 0 },
  test: { include: ["tests/**/*.test.js"] },
});
