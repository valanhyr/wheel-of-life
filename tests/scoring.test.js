import test from "node:test";
import assert from "node:assert/strict";
import fixture from "./fixtures/finance-demo.json" with { type: "json" };
import { questions, areas, scoreAnswer, optionsFor, financeResult, financeBand, areaScores, scoreLevel } from "../src/data/scoring.js";

const own = questions.filter((q) => q.areaId === "finanzas" && q.scored !== false);
const byId = (id) => questions.find((q) => q.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const extreme = (maximum) => Object.fromEntries(own.map((q) => {
  const options = optionsFor(q).toSorted((a, b) => scoreAnswer(q, a.value) - scoreAnswer(q, b.value));
  return [q.id, options[maximum ? options.length - 1 : 0].value];
}));

test("all questions have unique IDs and usable scales", () => {
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.equal(own.length, 22);
  assert.equal(questions.length, 224);
  assert.equal(questions.filter((q) => !["finanzas", "trabajo"].includes(q.areaId)).length, 168);
  for (const q of questions) {
    assert.ok(optionsFor(q).length > 0);
    for (const option of optionsFor(q)) {
      const score = scoreAnswer(q, option.value);
      if (q.scored === false) assert.equal(score, null);
      else assert.ok(Number.isFinite(score) && score >= 0 && score <= 10);
    }
  }
});

test("demo uses equal dimension weights, not a mean of all 22 answers", () => {
  const r = financeResult(fixture.answers, 7);
  const expected = [61 / 9, 41 / 9, 6.25, 95 / 27];
  r.dimensions.forEach((d, i) => close(d.score, expected[i]));
  close(r.score, expected.reduce((a, b) => a + b) / 4);
  assert.equal(r.focus.name, "Proyección");
  assert.equal(r.pattern.id, "present_control_future_weak");
  assert.equal(r.contextComplete, true);
  assert.equal(areaScores(fixture.answers)[areas.findIndex((a) => a.id === "finanzas")], r.score);
});

test("negative and special scales are normalized exactly once", () => {
  assert.equal(scoreAnswer(byId("FIN_CON_05"), "nunca"), 10);
  assert.equal(scoreAnswer(byId("FIN_SEG_04"), 10), 0);
  assert.equal(scoreAnswer(byId("FIN_SEG_04"), 1), 10);
  assert.equal(scoreAnswer(byId("FIN_SEG_02"), "parcial"), 5);
  assert.equal(scoreAnswer(byId("FIN_SEG_03"), "4_6_meses"), 7.5);
  for (const value of [undefined, "", "invalid", NaN, -1, 11]) assert.equal(scoreAnswer(byId("FIN_CON_01"), value), null);
});

test("incomplete responses do not generate final interpretations", () => {
  const r = financeResult({ FIN_CON_01: 8 }, 7);
  assert.equal(r.score, null);
  assert.equal(r.summary, null);
  assert.equal(r.pattern, undefined);
  assert.equal(r.dimensions[0].text, null);
  assert.deepEqual(r.factors, []);
  assert.deepEqual(r.notes, []);
});

test("context and personal priorities do not change the score", () => {
  const r = financeResult({ ...fixture.answers, FIN_CTX_01: "no", FIN_CTX_02: "si_condicionan", FIN_CTX_03: "empeorado_algo", FIN_IMP_01: 0 }, 7);
  close(r.score, financeResult(fixture.answers, 7).score);
  assert.equal(r.notes.length, 4);
  assert.ok(r.factors.every((f) => f.count >= 2));
  assert.ok(!r.factors.some((f) => f.name === "Gestión de energía"));
});

test("extreme results, thresholds, and tied focus are classified consistently", () => {
  const low = financeResult(extreme(false), 0);
  const high = financeResult(extreme(true), 10);
  assert.equal(low.score, 0);
  assert.equal(high.score, 10);
  assert.equal(low.pattern.id, "all_low");
  assert.equal(high.pattern.id, "all_stable");
  assert.equal(low.focus.name, "Seguridad");
  for (const [value, id] of [[0, "critical"], [4, "attention"], [6, "improvement"], [7.5, "stable"], [10, "stable"]]) assert.equal(financeBand(value).id, id);
  assert.equal(scoreLevel(7, "finanzas").tone, "warn");
  assert.equal(scoreLevel(7, "salud").tone, "warn");
});

test("expanded areas wait for complete evidence rather than publish a one-question score", () => {
  const q = questions.find((q) => q.areaId === "salud");
  const value = optionsFor(q).at(-1).value;
  assert.equal(areaScores({ [q.id]: value })[0], null);
});
