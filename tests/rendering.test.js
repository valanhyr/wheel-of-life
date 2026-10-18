import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { areas, questions, areaScores, detailedResult } from "../src/data/scoring.js";

test("the questionnaire, result details and wheel render all eight completed areas", async () => {
  const stems = ["health", "emotional", "relationships", "family", "work", "finance", "growth", "leisure"];
  const answers = Object.assign({}, ...stems.map((stem) => JSON.parse(readFileSync(new URL(`./fixtures/${stem}-demo.json`, import.meta.url), "utf8")).answers));
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-render-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { Quiz, Results, Wheel, SectionSummary, AreaDetail } = await server.ssrLoadModule("/src/App.jsx");
    const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
    const selfEval = areas.map(() => 7);
    const scores = areaScores(answers);
    const results = render(Results, { selfEval, scores, answers });
    assert.equal((results.match(/Tus dimensiones/g) ?? []).length, 8);
    assert.equal((results.match(/Señales provisionales en /g) ?? []).length, 8);
    assert.equal((results.match(/Primer foco:/g) ?? []).length, 8);
    assert.ok(!results.includes("Sin responder"));
    for (const area of areas) {
      assert.ok(results.includes(`id="result-${area.id}"`));
      for (const dimension of area.dimensions) assert.ok(results.includes(dimension));
    }
    const wheel = render(Wheel, { selfEval, scores, activeIndex: null, onSelect() {}, onStartSection() {} });
    assert.equal((wheel.match(/r="1.4"/g) ?? []).length, 8);
    assert.ok(!wheel.includes("NaN"));
    assert.equal((wheel.match(/role="button"/g) ?? []).length, 8);
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const quiz = render(Quiz, { qIndex, answers, setQIndex() {}, onAnswer() {}, onDone() {} });
      assert.ok(quiz.includes(`name="${questions[qIndex].id}"`));
      assert.equal((quiz.match(/checked=""/g) ?? []).length, 1, questions[qIndex].id);
      assert.ok(quiz.includes(qIndex === questions.length - 1 ? "Ver resumen" : "Siguiente"));
      // Only the Back button on the first question should be disabled.
      assert.equal((quiz.match(/disabled=""/g) ?? []).length, qIndex === 0 ? 1 : 0);
    }
    const partialAnswers = { ...answers };
    delete partialAnswers.SAL_HAB_01;
    const partialScores = areaScores(partialAnswers);
    const partial = render(Results, { selfEval, scores: partialScores, answers: partialAnswers });
    assert.ok(partial.includes("21/22 puntuables"));
    assert.ok(partial.includes("Pendiente de completar"));
    assert.ok(partial.includes("Completa las 22 preguntas puntuables de Salud"));
    assert.equal((partial.match(/Primer foco:/g) ?? []).length, 7);
    assert.equal((render(Wheel, { selfEval, scores: partialScores, activeIndex: null, onSelect() {}, onStartSection() {} }).match(/r="1.4"/g) ?? []).length, 7);

    // Section summary must show the numeric gap, never NaN.
    for (const [index, area] of areas.entries()) {
      const perception = 5;
      const summary = render(SectionSummary, { area, score: scores[index], perception, onBack() {}, answers });
      assert.ok(!summary.includes("NaN"), `SectionSummary for ${area.id} must not render NaN`);
      const expected = Math.round((scores[index] - perception) * 10) / 10;
      assert.ok(summary.includes(`${expected > 0 ? "+" : ""}${expected}`), `SectionSummary for ${area.id} must show gap ${expected}`);
    }

    // The priority reading is unified into a single label.
    const detail = render(AreaDetail, { result: detailedResult("salud", answers, 5), areaName: "Salud" });
    assert.ok(detail.includes("Prioridad de esta área"), "the results detail must show a single priority label");
    assert.ok(!detail.includes("Deseo de cambio"), "the results detail must not show a separate desire label");
  } finally {
    await server.close();
  }
});

test("the initial screen has no global self-evaluation; perception is collected per area", async () => {
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-render-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { default: App, SectionSelfEval } = await server.ssrLoadModule("/src/App.jsx");
    const html = renderToStaticMarkup(React.createElement(App));
    assert.ok(!html.includes("Autoevaluación rápida"), "the global self-evaluation section must be removed");
    assert.ok(!html.includes("Ir al cuestionario"), "the global self-evaluation action must be removed");
    assert.ok(html.includes("Cuestionario"), "the questionnaire section must remain on the initial screen");
    const selfEval = renderToStaticMarkup(React.createElement(SectionSelfEval, { area: areas[0], value: 5, onChange() {}, onStart() {} }));
    assert.ok(selfEval.includes("Tu percepción de"), "per-area perception must remain available when a section starts");
  } finally {
    await server.close();
  }
});
