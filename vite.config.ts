import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5180,
  },
  preview: {
    port: 5181,
  },
  build: {
    // inline fonts into the CSS so the built app is fully self-contained
    assetsInlineLimit: 1_000_000,
  },
});
