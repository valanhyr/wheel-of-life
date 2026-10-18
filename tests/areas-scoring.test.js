import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { additionalAreas } from "../src/data/additional-areas.js";
import {
  areas, questions, optionsFor, scoreAnswer, detailedResult, areaScores, areaBand,
  scoreLevel, gapStatus, priorityOrder,
} from "../src/data/scoring.js";

const stems = { salud: "health", emocional: "emotional", relaciones: "relationships", familia: "family", crecimiento: "growth", ocio: "leisure", finanzas: "finance", trabajo: "work" };
const fixtures = Object.fromEntries(Object.entries(stems).map(([id, stem]) => [id, JSON.parse(readFileSync(new URL(`./fixtures/${stem}-demo.json`, import.meta.url), "utf8"))]));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const scoredFor = (id) => questions.filter((q) => q.areaId === id && q.scored);
const answersAt = (id, dimensionScores) => Object.fromEntries(scoredFor(id).map((q) => {
  const target = typeof dimensionScores === "number" ? dimensionScores : dimensionScores[q.dimension];
  const option = optionsFor(q).reduce((best, o) => Math.abs(scoreAnswer(q, o.value) - target) < Math.abs(scoreAnswer(q, best.value) - target) ? o : best);
  return [q.id, option.value];
}));

test("all eight areas have the same complete 27-question structure", () => {
  assert.equal(questions.length, 216);
  assert.equal(new Set(questions.map((q) => q.id)).size, 216);
  for (const area of areas) {
    const own = questions.filter((q) => q.areaId === area.id);
    assert.equal(own.length, 27, area.id);
    assert.equal(own.filter((q) => q.scored).length, 22);
    assert.equal(own.filter((q) => !q.scored && q.dimension === "Contexto").length, 4);
    assert.equal(own.filter((q) => !q.scored).length, 5);
    assert.deepEqual(area.dimensions.map((d) => own.filter((q) => q.dimension === d).length), [5, 5, 6, 6]);
    for (const q of own) {
      assert.ok(q.required);
      assert.equal(q.factors.length > 0, q.scored);
      assert.ok(optionsFor(q).some((o) => o.value === fixtures[area.id].answers[q.id]), q.id);
    }
  }
});

for (const [id, config] of Object.entries(additionalAreas)) {
  const { catalog, rules, prefix } = config;
  const own = scoredFor(id);
  const fixture = fixtures[id];
  const dims = areas.find((a) => a.id === id).dimensions;

  test(`${id}: rules, catalogs and transversal mappings are complete`, () => {
    assert.deepEqual(Object.keys(rules.dimensions), dims);
    assert.deepEqual(Object.keys(catalog.dimension_results), dims);
    assert.deepEqual(rules.focusOrder.toSorted(), dims.toSorted());
    const linked = Object.values(rules.dimensions).flatMap((d) => d.question_ids);
    assert.equal(new Set(linked).size, 22);
    assert.deepEqual(linked.toSorted(), own.map((q) => q.id).toSorted());
    for (const dim of dims) {
      assert.equal(rules.dimensionWeights[dim], 0.25);
      assert.ok(rules.dimensions[dim].question_ids.every((qid) => own.find((q) => q.id === qid)?.dimension === dim));
      for (const band of catalog.score_bands) assert.ok(catalog.dimension_results[dim][band.id]);
    }
    for (const q of own) {
      assert.equal(q.dimensionWeight, 1);
      assert.deepEqual(Object.keys(q.factorWeights), q.factors);
      for (const factor of q.factors) {
        assert.equal(q.factorWeights[factor], 1);
        for (const band of catalog.score_bands) assert.ok(catalog.transversal_factor_results[factor][band.id]);
      }
    }
    for (const rule of rules.contextRules) {
      const q = questions.find((q) => q.id === rule.questionId);
      assert.equal(q.scored, false);
      assert.ok(rule.values.every((value) => optionsFor(q).some((o) => o.value === value)));
      assert.ok(rules.contextNotes[rule.noteIndex]);
    }
    for (const rule of rules.patternRules) {
      assert.ok(config.patterns.some((p) => p.id === rule.id));
      assert.ok(rule.all.every((c) => dims.includes(c.dimension) && ["gte", "lt"].includes(c.operator)));
    }
  });

  test(`${id}: synthetic example yields the expected dimensions, weighted score and wheel value`, () => {
    const r = detailedResult(id, fixture.answers, fixture.answers[`${prefix}_PER_01`]);
    r.dimensions.forEach((d) => close(d.score, fixture.expected.dimensions[d.name]));
    close(r.score, fixture.expected.score);
    assert.equal(r.focus.name, fixture.expected.focus);
    assert.equal(r.complete, true);
    assert.equal(r.contextComplete, true);
    assert.ok(r.summary.headline && r.summary.body && r.summary.action_logic);
    assert.ok(r.pattern && r.perceptionText);
    close(areaScores(fixture.answers)[areas.findIndex((a) => a.id === id)], r.score);
    assert.equal(priorityOrder(areaScores(fixture.answers), areas.map(() => 7))[0].area.id, id);
    // Unequal question counts must not bias the area score toward the last two dimensions.
    const extremes = Object.fromEntries(dims.map((dim, i) => [dim, i < 2 ? 10 : 0]));
    assert.equal(detailedResult(id, answersAt(id, extremes)).score, 5);
  });

  test(`${id}: missing or invalid scored answers never generate a final result`, () => {
    assert.equal(detailedResult(id, {}).answered, 0);
    assert.deepEqual(detailedResult(id, {}).factors, []);
    for (const q of own) {
      for (const invalid of [undefined, "invalid"]) {
        const r = detailedResult(id, { ...fixture.answers, [q.id]: invalid }, 7);
        assert.equal(r.answered, 21);
        assert.equal(r.complete, false);
        assert.equal(r.score, null);
        assert.equal(r.summary, null);
        assert.equal(r.pattern, undefined);
        assert.equal(r.focus, null);
        assert.equal(r.perceptionText, undefined);
        assert.equal(r.dimensions.find((d) => d.name === q.dimension).text, null);
      }
      // A single answer can be shown provisionally, but supplies no two-answer factor.
      assert.deepEqual(detailedResult(id, { [q.id]: fixture.answers[q.id] }).factors, []);
    }
  });

  test(`${id}: context and personal priorities add notes without altering scores or factors`, () => {
    const original = detailedResult(id, fixture.answers, 7);
    assert.equal(original.notes.length, 4);
    const justScored = Object.fromEntries(own.map((q) => [q.id, fixture.answers[q.id]]));
    const r = detailedResult(id, justScored, 7);
    assert.equal(r.contextComplete, false);
    assert.equal(r.complete, true);
    assert.deepEqual(r.notes, []);
    assert.deepEqual(r.factors, original.factors);
    close(r.score, original.score);
    const changed = detailedResult(id, { ...fixture.answers, [`${prefix}_IMP_01`]: 0, [`${prefix}_CTX_04`]: "ninguna" }, 7);
    assert.equal(changed.importance, 0);
    assert.equal(changed.desire, undefined);
    assert.equal(changed.notes.length, 3);
    close(changed.score, r.score);
    assert.equal(detailedResult(id, { ...fixture.answers, [`${prefix}_CTX_01`]: "invalid" }).contextComplete, false);
    const counts = Object.fromEntries(Object.keys(catalog.transversal_factor_results).map((f) => [f, own.filter((q) => q.factors.includes(f)).length]));
    assert.deepEqual(r.factors.map((f) => f.name), Object.keys(counts).filter((f) => counts[f] >= 2));
    for (const factor of r.factors) {
      const evidence = own.filter((q) => q.factors.includes(factor.name));
      close(factor.score, evidence.reduce((sum, q) => sum + scoreAnswer(q, fixture.answers[q.id]), 0) / evidence.length);
      assert.ok(factor.text);
    }
  });

  test(`${id}: all result patterns are reachable and global patterns take precedence`, () => {
    const low = detailedResult(id, answersAt(id, 0));
    const high = detailedResult(id, answersAt(id, 10));
    assert.equal(low.score, 0);
    assert.equal(high.score, 10);
    assert.equal(low.focus.name, rules.focusOrder[0]);
    assert.equal(low.pattern.id, "all_low");
    assert.equal(high.pattern.id, "all_stable");
    const seen = new Set([low.pattern.id, high.pattern.id]);
    for (let i = 0; i < 4; i++) {
      const values = Object.fromEntries(dims.map((d) => [d, 6.5]));
      values[dims[i]] = 10;
      values[dims[(i + 1) % 4]] = 0;
      const r = detailedResult(id, answersAt(id, values));
      assert.equal(r.pattern.id, rules.patternRules[i].id);
      seen.add(r.pattern.id);
    }
    const balanced = detailedResult(id, answersAt(id, 6.5));
    assert.equal(balanced.pattern.id, "balanced_progress");
    seen.add(balanced.pattern.id);
    const mixedValues = Object.fromEntries(dims.map((d, i) => [d, i === 0 ? 5 : 6.5]));
    const mixed = detailedResult(id, answersAt(id, mixedValues));
    assert.equal(mixed.pattern.id, "mixed");
    seen.add(mixed.pattern.id);
    assert.deepEqual([...seen].toSorted(), config.patterns.map((p) => p.id).toSorted());
  });

  test(`${id}: scales and comparison bands match the Finance and Work conventions`, () => {
    for (const q of own.filter((q) => q.polarity === "negativa")) {
      assert.equal(scoreAnswer(q, "nunca"), 10);
      assert.equal(scoreAnswer(q, "siempre"), 0);
    }
    for (const [value, band] of [[0, "critical"], [4, "attention"], [6, "improvement"], [7.5, "stable"], [10, "stable"]]) assert.equal(areaBand(id, value).id, band);
    assert.equal(scoreLevel(7, id).tone, "warn");
    assert.equal(scoreLevel(7.5, id).tone, "ok");
    const score = detailedResult(id, fixture.answers).score;
    for (const gap of [-2, -1, -0.99, 0, 0.99, 1, 2]) {
      const r = detailedResult(id, fixture.answers, score + gap);
      const expected = Math.abs(gap) < 1 ? "aligned" : `perception_${gap > 0 ? "higher" : "lower"}_${Math.abs(gap) >= 2 ? "high" : "moderate"}`;
      assert.equal(r.perceptionText, catalog.perception_results.find((p) => p.id === expected).text);
      assert.equal(gapStatus(score, score + gap, id).dir, Math.abs(gap) < 1 ? "even" : gap > 0 ? "down" : "up");
    }
  });
}

test("the complete questionnaire feeds eight independent wheel scores and result details", () => {
  const combined = Object.assign({}, ...Object.values(fixtures).map((f) => f.answers));
  const scores = areaScores(combined);
  assert.equal(scores.length, 8);
  assert.ok(scores.every(Number.isFinite));
  for (const area of areas) assert.deepEqual(detailedResult(area.id, combined, 7), detailedResult(area.id, fixtures[area.id].answers, 7));
  const ranked = priorityOrder(scores, areas.map(() => 7));
  assert.equal(ranked.length, 8);
  assert.ok(ranked.every((row, i) => i === 0 || ranked[i - 1].score <= row.score));
  assert.deepEqual(areaScores({}), Array(8).fill(null));
});
