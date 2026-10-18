import test from "node:test";
import assert from "node:assert/strict";
import document from "../src/data/questions.json" with { type: "json" };
import { updateQuestionText, createQuestionFrom, restoreDraft, exportQuestions } from "../src/data/question-editor.js";

const hab = document.questions.findIndex((q) => q.id === "SAL_HAB_01");

test("editing preserves the original document and question metadata", () => {
  const updated = updateQuestionText(document.questions, "SAL_HAB_01", "  Nuevo texto  ");
  assert.equal(updated[hab].text, "Nuevo texto");
  assert.equal(updated[hab].id, "SAL_HAB_01");
  assert.deepEqual(updated[hab].factors, document.questions[hab].factors);
  assert.notEqual(updated[hab], document.questions[hab]);
  assert.equal(document.questions[hab].text, "Mantengo rutinas de alimentación, movimiento y sueño que me sostienen durante la semana.");
  assert.throws(() => updateQuestionText(updated, "SAL_HAB_01", "  "), /enunciado/i);
  assert.throws(() => updateQuestionText(updated, "missing", "Hola"), /existe/i);
});

test("creation clones the template, assigns a unique ID and stays in the same area", () => {
  const created = createQuestionFrom(document.questions, "SAL_HAB_01", "Una pregunta nueva");
  const copy = created.at(-1);
  assert.equal(copy.id, "SAL_HAB_06");
  assert.equal(copy.text, "Una pregunta nueva");
  assert.equal(copy.areaId, "salud");
  assert.deepEqual(copy.factors, document.questions[hab].factors);
  assert.notEqual(copy.factors, document.questions[hab].factors);
  assert.equal(createQuestionFrom(created, "SAL_HAB_01", "Otra").at(-1).id, "SAL_HAB_07");
  assert.throws(() => createQuestionFrom(document.questions, "missing", "Hola"), /existe/i);
});

test("invalid saved drafts are rejected and export preserves the whole document", () => {
  assert.equal(restoreDraft("bad json", document.questions), null);
  assert.equal(restoreDraft(JSON.stringify([{ ...document.questions[0], text: "" }]), document.questions), null);
  assert.equal(restoreDraft(JSON.stringify([{ ...document.questions[0], id: "SAL_IMP_01" }, { ...document.questions[0], id: "SAL_IMP_01" }]), document.questions), null);
  assert.equal(restoreDraft(JSON.stringify(document.questions.map((q, index) => index === 0 ? { ...q, scored: true } : q)), document.questions), null);
  const changed = updateQuestionText(document.questions, "SAL_HAB_01", "Nuevo");
  assert.deepEqual(restoreDraft(JSON.stringify(changed), document.questions), changed);
  const created = createQuestionFrom(changed, "SAL_HAB_01", "Nueva pregunta");
  assert.deepEqual(restoreDraft(JSON.stringify(created), document.questions), created);
  const result = JSON.parse(exportQuestions(document, changed));
  assert.equal(result.schema_version, document.schema_version);
  assert.deepEqual(result.areas, document.areas);
  assert.equal(result.questions[hab].text, "Nuevo");
});
