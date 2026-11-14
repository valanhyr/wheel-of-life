import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("app offers accessible manual JSON transfer with a privacy warning", async () => {
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-render-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { default: App } = await server.ssrLoadModule("/src/App.jsx");
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /Exportar progreso/);
    assert.match(html, /Importar progreso/);
    assert.match(html, /type="file"[^>]*accept="\.json,application\/json"/);
    assert.match(html, /no está cifrado/i);
    assert.match(html, /role="status"/);
  } finally {
    await server.close();
  }
});
