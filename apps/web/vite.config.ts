import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo las llamadas a /api se envían a la API local (apps/api).
    proxy: { "/api": "http://localhost:3000" },
  },
});
