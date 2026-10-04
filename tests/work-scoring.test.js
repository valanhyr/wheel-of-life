import test from "node:test";
import assert from "node:assert/strict";
import fixture from "./fixtures/work-demo.json" with { type: "json" };
import financeFixture from "./fixtures/finance-demo.json" with { type: "json" };
import rules from "../src/data/work-rules.json" with { type: "json" };
import catalog from "../src/data/work-results.json" with { type: "json" };
import {
  questions, areas, scoreAnswer, optionsFor, workResult, workBand, financeResult,
  areaScores, scoreLevel, gapStatus, priorityOrder, detailedResult,
} from "../src/data/scoring.js";

const own = questions.filter((q) => q.areaId === "trabajo");
const scored = own.filter((q) => q.scored !== false);
const byId = (id) => own.find((q) => q.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const extreme = (maximum) => Object.fromEntries(scored.map((q) => {
  const options = optionsFor(q).toSorted((a, b) => scoreAnswer(q, a.value) - scoreAnswer(q, b.value));
  return [q.id, options[maximum ? options.length - 1 : 0].value];
}));

test("Trabajo matches Finance question counts and has complete dimension and factor mappings", () => {
  const finance = questions.filter((q) => q.areaId === "finanzas");
  assert.equal(own.length, finance.length);
  assert.equal(own.length, 28);
  assert.equal(scored.length, 22);
  assert.equal(own.filter((q) => !q.scored && q.dimension === "Prioridades").length, 2);
  assert.equal(own.filter((q) => !q.scored && q.dimension === "Contexto").length, 4);
  assert.deepEqual(Object.keys(rules.dimensions), areas.find((a) => a.id === "trabajo").dimensions);
  assert.deepEqual(Object.values(rules.dimensions).map((r) => r.question_ids.length), [5, 5, 6, 6]);
  const ids = Object.values(rules.dimensions).flatMap((r) => r.question_ids);
  assert.equal(new Set(ids).size, 22);
  assert.deepEqual(ids.toSorted(), scored.map((q) => q.id).toSorted());
  for (const q of scored) {
    assert.ok(rules.dimensions[q.dimension].question_ids.includes(q.id));
    assert.ok(q.factors.length > 0);
    assert.ok(q.factors.every((f) => catalog.transversal_factor_results[f] && q.factorWeights[f] === 1));
  }
  for (const name of Object.keys(catalog.transversal_factor_results)) {
    assert.ok(scored.filter((q) => q.factors.includes(name)).length >= 2, name);
  }
  for (const q of own) assert.ok(optionsFor(q).some((o) => o.value === fixture.answers[q.id]), q.id);
});

test("work demo calculates an equal average of four dimensions and feeds wheel and comparison", () => {
  const r = workResult(fixture.answers, fixture.answers.TRA_PER_01);
  const expected = [(20 / 3 + 7.5 + 5 + 20 / 3 + 70 / 9) / 5, 55 / 9, 175 / 54, 25 / 6];
  r.dimensions.forEach((d, i) => close(d.score, expected[i]));
  close(r.score, expected.reduce((a, b) => a + b) / 4);
  assert.equal(r.focus.name, "Condiciones");
  assert.equal(r.pattern.id, "satisfied_conditions_weak");
  assert.equal(r.contextComplete, true);
  assert.equal(r.factors.length, 8);
  assert.ok(r.factors.every((f) => f.text && Number.isFinite(f.score)));
  assert.ok(r.summary.headline.includes("profesional"));
  assert.ok(r.perceptionText.includes("algo más positiva"));
  const scores = areaScores(fixture.answers);
  assert.equal(scores[areas.findIndex((a) => a.id === "trabajo")], r.score);
  assert.equal(priorityOrder(scores, areas.map(() => 7))[0].area.id, "trabajo");
  assert.deepEqual(detailedResult("trabajo", fixture.answers, 7), r);
  assert.equal(detailedResult("salud", fixture.answers, 7).score, null);
  assert.equal(detailedResult("unknown", fixture.answers, 7), null);
});

test("work negative answers invert once, including the original boundary question", () => {
  for (const id of ["TRA_SAT_03", "TRA_CON_03", "TRA_PRO_06"]) {
    assert.equal(scoreAnswer(byId(id), "nunca"), 10);
    assert.equal(scoreAnswer(byId(id), "siempre"), 0);
  }
  assert.equal(scoreAnswer(byId("TRA_DES_01"), "siempre"), 10);
  for (const value of [undefined, "", "invalid", NaN, -1, 11, "8"]) {
    assert.equal(scoreAnswer(byId("TRA_SAT_01"), value), null);
  }
});

test("every work scored response is required before publishing to the wheel", () => {
  for (const q of scored) {
    for (const value of [undefined, "invalid"]) {
      const answers = { ...fixture.answers, [q.id]: value };
      const r = workResult(answers, 7);
      assert.equal(r.answered, 21);
      assert.equal(r.complete, false);
      assert.equal(r.score, null);
      assert.equal(r.summary, null);
      assert.equal(r.pattern, undefined);
      assert.equal(r.focus, null);
      assert.equal(r.perceptionText, undefined);
      assert.equal(r.dimensions.find((d) => d.name === q.dimension).text, null);
      assert.equal(areaScores(answers)[areas.findIndex((a) => a.id === "trabajo")], null);
    }
  }
  assert.deepEqual(workResult({}).factors, []);
  assert.equal(workResult({}).answered, 0);
  assert.equal(workResult({ TRA_SAT_01: 7 }).dimensions[0].complete, false);
});

test("context and priorities personalize work without changing scores or factors", () => {
  const base = workResult(fixture.answers, 7);
  const changed = workResult({ ...fixture.answers, TRA_CTX_01: "busqueda", TRA_IMP_01: 0, TRA_CAM_01: 0 }, 7);
  close(changed.score, base.score);
  assert.deepEqual(changed.factors, base.factors);
  assert.equal(changed.notes.length, 4);
  assert.equal(changed.importance, 0);
  assert.equal(changed.desire, 0);
  const onlyScored = Object.fromEntries(scored.map((q) => [q.id, fixture.answers[q.id]]));
  const r = workResult(onlyScored, 7);
  assert.equal(r.complete, true);
  assert.equal(r.contextComplete, false);
  assert.deepEqual(r.notes, []);
  close(r.score, base.score);
  for (const q of own.filter((q) => !q.scored)) assert.equal(scoreAnswer(q, fixture.answers[q.id]), null);
});

test("work extremes, bands, perception boundaries and tied focus follow Finance rules", () => {
  const low = workResult(extreme(false), 0);
  const high = workResult(extreme(true), 10);
  assert.equal(low.score, 0);
  assert.equal(high.score, 10);
  assert.equal(low.pattern.id, "all_low");
  assert.equal(high.pattern.id, "all_stable");
  assert.equal(low.focus.name, "Condiciones");
  for (const [value, id] of [[0, "critical"], [4, "attention"], [6, "improvement"], [7.5, "stable"], [10, "stable"]]) assert.equal(workBand(value).id, id);
  assert.equal(scoreLevel(7, "trabajo").tone, "warn");
  assert.equal(scoreLevel(7.5, "trabajo").tone, "ok");
  for (const gap of [-2, -1, -0.99, 0, 0.99, 1, 2]) {
    const score = workResult(fixture.answers).score;
    const r = workResult(fixture.answers, score + gap);
    const id = Math.abs(gap) < 1 ? "aligned" : `perception_${gap > 0 ? "higher" : "lower"}_${Math.abs(gap) >= 2 ? "high" : "moderate"}`;
    assert.equal(r.perceptionText, catalog.perception_results.find((p) => p.id === id).text);
    assert.equal(gapStatus(score, score + gap, "trabajo").dir, Math.abs(gap) < 1 ? "even" : gap > 0 ? "down" : "up");
  }
});

test("each work pattern can be selected and has its own interpretation", () => {
  // Each dimension uses all minimum or all maximum answers so conditions are independent.
  const cases = [
    [[true, false, false, false], "satisfied_conditions_weak"],
    [[false, true, true, false], "development_good_projection_weak"],
    [[false, false, false, true], "projection_good_development_weak"],
    [[false, true, true, true], "conditions_good_satisfaction_weak"],
    [[false, false, false, false], "all_low"],
    [[true, true, true, true], "all_stable"],
    [[false, true, false, false], "conditions_weak_projection_weak"],
  ];
  const min = extreme(false), max = extreme(true);
  for (const [levels, expected] of cases) {
    const answers = Object.fromEntries(scored.map((q) => [q.id, (levels[Object.keys(rules.dimensions).indexOf(q.dimension)] ? max : min)[q.id]]));
    assert.equal(workResult(answers).pattern.id, expected);
  }
  // Intermediate values can yield a mixed result without a stable global pattern.
  const makeDimensionScore = (name, score) => Object.fromEntries(scored.filter((q) => q.dimension === name).map((q) => {
    const option = optionsFor(q).reduce((best, o) => Math.abs(scoreAnswer(q, o.value) - score) < Math.abs(scoreAnswer(q, best.value) - score) ? o : best);
    return [q.id, option.value];
  }));
  const middle = Object.assign({}, ...Object.keys(rules.dimensions).map((name) => makeDimensionScore(name, 6.5)));
  assert.equal(workResult(middle).pattern.id, "mixed");
});

test("Finance and Work keep independent results and transversal evidence", () => {
  const combined = { ...financeFixture.answers, ...fixture.answers };
  assert.deepEqual(financeResult(combined, 7), financeResult(financeFixture.answers, 7));
  assert.deepEqual(workResult(combined, 7), workResult(fixture.answers, 7));
  assert.equal(workResult(financeFixture.answers).score, null);
  assert.equal(financeResult(fixture.answers).score, null);
  assert.equal(areaScores(combined).filter((s) => s != null).length, 2);
});
