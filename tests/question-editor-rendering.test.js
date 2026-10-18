import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import document from "../src/data/questions.json" with { type: "json" };

test("editor renders areas, questions, editable text and export controls", async () => {
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-editor-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { default: Editor, ImpactReview } = await server.ssrLoadModule("/src/QuestionEditor.jsx");
    const html = renderToStaticMarkup(React.createElement(Editor, { onClose() {} }));
    assert.ok(html.includes("Editor de preguntas"));
    assert.ok(html.includes("Salud"));
    assert.ok(html.includes("SAL_HAB_01"));
    assert.ok(html.includes(document.questions.find((q) => q.id === "SAL_HAB_01").text));
    assert.ok(html.includes("Crear pregunta"));
    assert.ok(html.includes("Revisar impacto"));
    assert.ok(html.includes("Eliminar pregunta"));
    assert.ok(html.includes("JSON de la pregunta"));
    assert.ok(html.includes("Identificador (ID)"));
    assert.ok(html.includes("Enunciado"));
    assert.ok(html.includes("Puntuable"));
    assert.ok(html.includes("Reglas del área"));
    assert.ok(html.includes("Escalas de respuesta"));
    assert.ok(html.includes("Duplicar escala para esta pregunta"));
    assert.ok(html.includes("Preguntas que usan esta escala"));
    assert.ok(html.includes("Revisar impacto"));
    assert.ok(html.includes("Identidad interna"));
    assert.ok(html.includes("Área de la pregunta"));
    assert.ok(html.includes("Volver al cuestionario"));
    const review = renderToStaticMarkup(React.createElement(ImpactReview, { impact: { added: [], removed: [], changed: ["SAL_HAB_01"], renamed: [{ from: "SAL_HAB_01", to: "SAL_HAB_99" }], areas: ["salud"], scaleChanges: [], fixtures: { salud: { before: 7, after: null } } }, onConfirm() {}, onCancel() {}, saving: false }));
    assert.ok(review.includes("Confirmar y guardar JSON"));
    assert.ok(review.includes("No comparable"));
    assert.ok(review.includes("respuestas históricas"));
    const { default: App } = await server.ssrLoadModule("/src/App.jsx");
    const appHtml = renderToStaticMarkup(React.createElement(App));
    assert.ok(appHtml.includes("Editar preguntas"));
    assert.ok(!appHtml.includes("Confirmar y guardar JSON"));
  } finally {
    await server.close();
  }
});
