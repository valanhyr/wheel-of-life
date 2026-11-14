import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { areas, questions, optionsFor, areaScores } from "../src/data/scoring.js";
import { exportProgress, importProgress } from "../src/data/answer-transfer.js";

const perceptions = areas.map((_, i) => i + 1);
const sample = Object.fromEntries(questions.slice(0, 3).map((q) => [q.id, optionsFor(q)[0].value]));

test("partial and complete progress round-trip by UID without copying question texts or resources", () => {
  for (const answers of [sample, Object.fromEntries(questions.map((q) => [q.id, optionsFor(q)[0].value]))]) {
    const text = exportProgress(answers, perceptions);
    const payload = JSON.parse(text);
    assert.equal(payload.version, 1);
    assert.equal(payload.format, "wheel-of-life-progress");
    assert.equal(payload.answers.length, Object.keys(answers).length);
    assert.ok(payload.answers.every(([uid]) => questions.some((q) => q.uid === uid)));
    assert.ok(!text.includes(questions[0].text));
    assert.ok(!text.includes("finance-resources"));
    assert.deepEqual(importProgress(text), { answers, selfEval: perceptions });
    assert.deepEqual(areaScores(importProgress(text).answers), areaScores(answers));
  }
});

test("rejects damaged, incompatible and oversized files instead of restoring partially", () => {
  const good = JSON.parse(exportProgress(sample, perceptions));
  const invalid = [
    "{", "x".repeat(1024 * 1024 + 1),
    JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, format: "other" }),
    JSON.stringify({ ...good, answers: [...good.answers, good.answers[0]] }),
    JSON.stringify({ ...good, answers: [["unknown", 1]] }),
    JSON.stringify({ ...good, answers: [[good.answers[0][0], "not-an-option"]] }),
    JSON.stringify({ ...good, answers: [[good.answers[0][0], { surprise: true }]] }),
    JSON.stringify({ ...good, perceptions: { ...good.perceptions, [areas[0].id]: 11 } }),
    JSON.stringify({ ...good, perceptions: { [areas[0].id]: 5 } }),
  ];
  for (const file of invalid) assert.throws(() => importProgress(file), Error);
});

test("refuses to export unknown answers or invalid self-evaluations", () => {
  assert.throws(() => exportProgress({ ...sample, UNKNOWN: 7 }, perceptions));
  assert.throws(() => exportProgress(sample, [Number.NaN, ...perceptions.slice(1)]));
});

test("the downloadable Finance demo imports as a complete synthetic result", () => {
  const text = readFileSync(new URL("./fixtures/finance-progress-import-demo.json", import.meta.url), "utf8");
  const { answers, selfEval } = importProgress(text);
  assert.equal(Object.keys(answers).length, 27);
  assert.ok(areaScores(answers)[areas.findIndex((area) => area.id === "finanzas")] != null);
  assert.equal(selfEval[areas.findIndex((area) => area.id === "finanzas")], 7);
});
