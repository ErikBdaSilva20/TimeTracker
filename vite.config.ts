import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  // Vite usa PostCSS em dev e só roda Lightning CSS no build por padrão — isso
  // fazia transforms exclusivos do build (ex.: colapsar `-webkit-backdrop-filter`
  // pra forma prefixada que o Chrome ignora) divergirem do preview em dev.
  // Rodar Lightning CSS nos dois mantém o preview fiel ao output real.
  css: { transformer: "lightningcss" },
});
