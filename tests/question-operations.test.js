import test from "node:test";
import assert from "node:assert/strict";
import document from "../src/data/questions.json" with { type: "json" };
import health from "../src/data/health-rules.json" with { type: "json" };
import finance from "../src/data/finance-rules.json" with { type: "json" };
import scales from "../src/data/response-scales.json" with { type: "json" };
import { changeQuestion, removeQuestion, createQuestion, duplicateScale, changeScale } from "../src/data/question-operations.js";

const baseline = () => ({ document: structuredClone(document), rules: { salud: structuredClone(health), finanzas: structuredClone(finance) }, scales: structuredClone(scales) });

test("every original question has an immutable unique uid", () => {
  assert.equal(new Set(document.questions.map((q) => q.uid)).size, document.questions.length);
  assert.ok(document.questions.every((q) => typeof q.uid === "string" && q.uid.length > 3));
});

test("rename, move, toggle scoring and removal keep dimension and context references consistent", () => {
  const start = baseline();
  const q = start.document.questions.find((item) => item.id === "SAL_HAB_01");
  const moved = changeQuestion(start, q.uid, { ...q, id: "SAL_HAB_99", dimension: "Energía y vitalidad" });
  assert.equal(moved.document.questions.find((item) => item.uid === q.uid).id, "SAL_HAB_99");
  assert.ok(!moved.rules.salud.dimensions.Hábitos.question_ids.includes(q.id));
  assert.ok(moved.rules.salud.dimensions["Energía y vitalidad"].question_ids.includes("SAL_HAB_99"));
  const unscored = changeQuestion(moved, q.uid, { ...moved.document.questions.find((item) => item.uid === q.uid), scored: false, dimension: "Contexto" });
  assert.ok(!Object.values(unscored.rules.salud.dimensions).some((d) => d.question_ids.includes("SAL_HAB_99")));
  const ctx = start.document.questions.find((item) => item.id === "SAL_CTX_01");
  const renamed = changeQuestion(start, ctx.uid, { ...ctx, id: "SAL_CTX_99" });
  assert.equal(renamed.rules.salud.contextRules[0].questionId, "SAL_CTX_99");
  const deleted = removeQuestion(renamed, ctx.uid);
  assert.ok(!deleted.rules.salud.contextRules.some((r) => r.questionId === "SAL_CTX_99"));
  assert.throws(() => changeQuestion(start, q.uid, { ...q, uid: "otro" }), /identidad/i);
});

test("creation clones all metadata with fresh uid and links scored items", () => {
  const start = baseline();
  const created = createQuestion(start, "SAL_HAB_01", "Pregunta adicional");
  const q = created.document.questions.at(-1);
  assert.equal(q.id, "SAL_HAB_06");
  assert.notEqual(q.uid, start.document.questions.find((item) => item.id === "SAL_HAB_01").uid);
  assert.ok(created.rules.salud.dimensions.Hábitos.question_ids.includes(q.id));
  const template = start.document.questions.find((item) => item.id === "SAL_HAB_01");
  const renamed = changeQuestion(start, template.uid, { ...template, id: "habito-principal" });
  assert.equal(createQuestion(renamed, "habito-principal", "Nueva").document.questions.at(-1).id, "habito-principal_01");
});

test("shared scales can be cloned for one question or changed for everyone", () => {
  const start = baseline();
  const q = start.document.questions.find((item) => item.id === "SAL_HAB_01");
  const { snapshot: copy, key } = duplicateScale(start, q.uid);
  assert.equal(copy.document.questions.find((item) => item.uid === q.uid).responseScale, key);
  assert.equal(copy.document.questions.find((item) => item.id === "SAL_HAB_02").responseScale, q.responseScale);
  const updated = changeScale(copy, key, { ...copy.scales[key], options: copy.scales[key].options.map((option, index) => index ? option : { ...option, score: 1 }) });
  assert.equal(updated.scales[key].options[0].score, 1);
  assert.equal(updated.scales[q.responseScale].options[0].score, 0);
});
