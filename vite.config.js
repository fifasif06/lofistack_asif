import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React + Vite. `npm run dev` for a live preview, `npm run build` for the real site (see build.js).
export default defineConfig({
  plugins: [react()],
});
