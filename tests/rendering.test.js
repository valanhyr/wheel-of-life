import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { areas, questions, areaScores, detailedResult, priorityOrder } from "../src/data/scoring.js";

test("area details, section summaries, wheel and priority ranking render for all eight areas", async () => {
  const stems = ["health", "emotional", "relationships", "family", "work", "finance", "growth", "leisure"];
  const answers = Object.assign({}, ...stems.map((stem) => JSON.parse(readFileSync(new URL(`./fixtures/${stem}-demo.json`, import.meta.url), "utf8")).answers));
  const server = await createServer({ configFile: false, cacheDir: "node_modules/.vite-render-tests", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  try {
    const { Quiz, PriorityRanking, Wheel, SectionSummary, AreaDetail, AreaSummaryBlock } = await server.ssrLoadModule("/src/App.jsx");
    const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
    const selfEval = areas.map(() => 7);
    const scores = areaScores(answers);

    // Each area keeps its four dimensions, transversal signals, context and focus.
    for (const [index, area] of areas.entries()) {
      const detail = render(AreaDetail, { result: detailedResult(area.id, answers, selfEval[index]), areaName: area.name });
      for (const dimension of area.dimensions) assert.ok(detail.includes(dimension), `${area.id} detail must include ${dimension}`);
      assert.ok(detail.includes("Señales provisionales en "), `${area.id} detail must include its signals`);
      assert.ok(detail.includes("Primer foco:"), `${area.id} detail must include its focus`);
      assert.ok(detail.includes("Prioridad de esta área"), "the area detail must show a single priority label");
      assert.ok(!detail.includes("Deseo de cambio"), "the area detail must not show a separate desire label");
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

    // An incomplete area keeps a partial detail and a pending summary block.
    const partialAnswers = { ...answers };
    delete partialAnswers.SAL_HAB_01;
    const partialScores = areaScores(partialAnswers);
    const partialDetail = render(AreaDetail, { result: detailedResult("salud", partialAnswers, 7), areaName: "Salud" });
    assert.ok(partialDetail.includes("Completa las 22 preguntas puntuables de Salud"));
    assert.ok(!partialDetail.includes("Primer foco:"));
    const pending = render(AreaSummaryBlock, { area: areas[0], score: partialScores[0], perception: 7, detail: detailedResult("salud", partialAnswers, 7) });
    assert.ok(pending.includes("Pendiente de completar"));
    assert.ok(pending.includes("—"));
    assert.equal((render(Wheel, { selfEval, scores: partialScores, activeIndex: null, onSelect() {}, onStartSection() {} }).match(/r="1.4"/g) ?? []).length, 7);

    // Section summary must show the numeric gap, never NaN.
    for (const [index, area] of areas.entries()) {
      const perception = 5;
      const summary = render(SectionSummary, { area, score: scores[index], perception, onBack() {}, answers });
      assert.ok(!summary.includes("NaN"), `SectionSummary for ${area.id} must not render NaN`);
      const expected = Math.round((scores[index] - perception) * 10) / 10;
      assert.ok(summary.includes(`${expected > 0 ? "+" : ""}${expected}`), `SectionSummary for ${area.id} must show gap ${expected}`);
    }

    // The section summary closes with the perception vs result block, after the area detail.
    for (const [index, area] of areas.entries()) {
      const summary = render(SectionSummary, { area, score: scores[index], perception: 5, onBack() {}, answers });
      for (const label of ["Tu percepción", "Resultado", "Brecha", "Tus dimensiones", "Primer foco:"]) {
        assert.ok(summary.includes(label), `SectionSummary for ${area.id} must include ${label}`);
      }
      assert.ok(
        summary.indexOf("Tus dimensiones") < summary.indexOf("Percepción vs resultado"),
        `SectionSummary for ${area.id} must show the summary block at the end`,
      );
    }

    // The ranking suggests priorities: worst result first, one row per scored area.
    const ranked = priorityOrder(scores, selfEval);
    const ranking = render(PriorityRanking, { selfEval, scores });
    assert.ok(ranking.includes("Ranking sugerido"));
    assert.equal((ranking.match(/class="ranking__item"/g) ?? []).length, 8);
    assert.ok(ranking.includes(`${ranked[0].area.name}`));
    assert.ok(
      ranking.indexOf(ranked[0].area.name) < ranking.indexOf(ranked.at(-1).area.name),
      "the worst area must rank before the best one",
    );
    const emptyRanking = render(PriorityRanking, { selfEval, scores: areas.map(() => null) });
    assert.equal((emptyRanking.match(/class="ranking__item"/g) ?? []).length, 0);
    assert.ok(emptyRanking.includes("Completa un área para ver su prioridad sugerida."));
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
    assert.ok(!html.includes("Percepción vs resultado"), "the standalone results section must be removed");
    assert.ok(!html.includes("Para profundizar en cualquier área"), "the reflection block must be removed");
    assert.ok(html.includes("Ranking sugerido"), "the priority ranking must sit under the wheel");
    const selfEval = renderToStaticMarkup(React.createElement(SectionSelfEval, { area: areas[0], value: 5, onChange() {}, onStart() {} }));
    assert.ok(selfEval.includes("Tu percepción de"), "per-area perception must remain available when a section starts");
  } finally {
    await server.close();
  }
});
