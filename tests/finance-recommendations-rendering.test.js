import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { areas, detailedResult } from "../src/data/scoring.js";

test("only completed Finance shows route choices and transparent outbound resources", async () => {
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-finance-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { SectionSummary } = await server.ssrLoadModule("/src/App.jsx");
    const fixture = JSON.parse(readFileSync(new URL("./fixtures/finance-demo.json", import.meta.url), "utf8"));
    const finance = areas.find((area) => area.id === "finanzas");
    const render = (area, answers) => renderToStaticMarkup(React.createElement(SectionSummary, {
      area, score: detailedResult(area.id, answers).score, perception: 5, onBack() {}, answers,
    }));
    const html = render(finance, fixture.answers);
    for (const text of ["Rutas para avanzar", "Estabilizar mi situación actual", "Organizar mis finanzas", "Empezar o consolidar el ahorro", "Planificar mi futuro y crecer", "Libros recomendados", "Herramientas", "Sugerencias orientativas", "De pago", "Gratuito", "Ya lo conozco/uso", "No me encaja"]) assert.ok(html.includes(text), text);
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes("Fichas Demo · solo desarrollo"));
    assert.ok(html.includes("example.com/pruebas-finanzas/herramienta"));
    assert.ok(html.includes("example.com/pruebas-finanzas/colaboracion"));
    assert.ok(html.includes("pueden mostrar error"));
    assert.match(html, /href="https:\/\/example\.com\/pruebas-finanzas\/herramienta" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /href="https:\/\/example\.com\/pruebas-finanzas\/colaboracion" target="_blank" rel="noopener noreferrer"/);
    assert.ok(!html.includes("Amazon"), "no unconfigured affiliate links");
    assert.ok(!render(finance, {}).includes("Rutas para avanzar"));
    assert.ok(!render(finance, {}).includes("Fichas Demo · solo desarrollo"));
    const healthAnswers = JSON.parse(readFileSync(new URL("./fixtures/health-demo.json", import.meta.url), "utf8")).answers;
    assert.ok(!render(areas.find((area) => area.id === "salud"), healthAnswers).includes("Rutas para avanzar"));
    assert.ok(!render(areas.find((area) => area.id === "salud"), healthAnswers).includes("Fichas Demo · solo desarrollo"));
  } finally {
    await server.close();
  }
});

test("production-mode rendering excludes demo cards and destinations", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let server;
  try {
    server = await createServer({ configFile: false, mode: "production", cacheDir: "node_modules/.vite-finance-prod-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
    const { SectionSummary } = await server.ssrLoadModule("/src/App.jsx");
    const fixture = JSON.parse(readFileSync(new URL("./fixtures/finance-demo.json", import.meta.url), "utf8"));
    const area = areas.find(({ id }) => id === "finanzas");
    const html = renderToStaticMarkup(React.createElement(SectionSummary, {
      area, score: detailedResult(area.id, fixture.answers).score, perception: 5, onBack() {}, answers: fixture.answers,
    }));
    assert.ok(html.includes("Rutas para avanzar"));
    assert.ok(!html.includes("Fichas Demo · solo desarrollo"));
    assert.ok(!html.includes("example.com/pruebas-finanzas/"));
  } finally {
    if (server) await server.close();
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
