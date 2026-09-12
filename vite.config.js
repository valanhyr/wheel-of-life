import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ensure PostCSS runs before LightningCSS minifier to avoid unknown-tailwind-rule errors
export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss'
  }
});
