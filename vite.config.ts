/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// React + TypeScript + Tailwind CSS, built with Vite.
// `npm run dev` = live preview · `npm run build` = the real site (see build.js) · `npm test` = all tests
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["components/**/*.test.tsx"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["components/*/component.tsx"],
      reporter: ["text", "json-summary"],
    },
  },
});
