import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createQuestionEditorMiddleware } from "./server/question-editor-api.js";
import { fileURLToPath } from "node:url";

const dataRoot = fileURLToPath(new URL("./src/data/", import.meta.url));

// Ensure PostCSS runs before LightningCSS minifier to avoid unknown-tailwind-rule errors
export default defineConfig({
  plugins: [react(), {
    name: "local-question-editor",
    apply: "serve",
    configureServer(server) { server.middlewares.use(createQuestionEditorMiddleware(dataRoot)); },
  }],
  server: { host: "127.0.0.1" },
  css: {
    transformer: 'postcss'
  }
});
