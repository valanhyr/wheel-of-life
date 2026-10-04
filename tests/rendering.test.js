import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { areas, questions, areaScores } from "../src/data/scoring.js";

test("the questionnaire, result details and wheel render all eight completed areas", async () => {
  const stems = ["health", "emotional", "relationships", "family", "work", "finance", "growth", "leisure"];
  const answers = Object.assign({}, ...stems.map((stem) => JSON.parse(readFileSync(new URL(`./fixtures/${stem}-demo.json`, import.meta.url), "utf8")).answers));
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-render-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { Quiz, Results, Wheel } = await server.ssrLoadModule("/src/App.jsx");
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
    const wheel = render(Wheel, { selfEval, scores, activeIndex: null, onSelect() {} });
    assert.equal((wheel.match(/r="1.4"/g) ?? []).length, 8);
    assert.ok(!wheel.includes("NaN"));
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const quiz = render(Quiz, { qIndex, answers, setQIndex() {}, onAnswer() {}, onDone() {} });
      assert.ok(quiz.includes(`name="${questions[qIndex].id}"`));
      assert.equal((quiz.match(/checked=""/g) ?? []).length, 1, questions[qIndex].id);
      assert.ok(quiz.includes(qIndex === questions.length - 1 ? "Ver resultados" : "Siguiente"));
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
    assert.equal((render(Wheel, { selfEval, scores: partialScores, activeIndex: null, onSelect() {} }).match(/r="1.4"/g) ?? []).length, 7);
  } finally {
    await server.close();
  }
});
