import test from "node:test";
import assert from "node:assert/strict";
import document from "../src/data/questions.json" with { type: "json" };
import health from "../src/data/health-rules.json" with { type: "json" };
import scales from "../src/data/response-scales.json" with { type: "json" };
import { validateEditorSnapshot, updateQuestion, deleteQuestion } from "../src/data/editor-validation.js";

const snapshot = () => ({ document: structuredClone(document), rules: { salud: structuredClone(health) } });
const hab = document.questions.findIndex((q) => q.id === "SAL_HAB_01");

test("validates edited metadata, unique ids and scales", () => {
  const state = snapshot();
  assert.deepEqual(validateEditorSnapshot(state).filter((e) => e.includes("salud")), []);
  state.document.questions[hab].id = state.document.questions[hab + 1].id;
  assert.match(validateEditorSnapshot(state).join(" "), /duplicado/i);
  state.document.questions[hab].id = "SAL_HAB_01";
  state.document.questions[hab].responseScale = "unknown";
  assert.match(validateEditorSnapshot(state).join(" "), /escala/i);
  delete state.document.questions[hab].responseScale;
  assert.match(validateEditorSnapshot(state).join(" "), /escala/i);
});

test("removing scored items or renaming ids requires matching rule changes", () => {
  const state = snapshot();
  state.document.questions = deleteQuestion(state.document.questions, "SAL_HAB_01");
  assert.match(validateEditorSnapshot(state).join(" "), /SAL_HAB_01/);
  state.rules.salud.dimensions.Hábitos.question_ids.shift();
  assert.deepEqual(validateEditorSnapshot(state).filter((e) => e.includes("SAL_HAB_01")), []);
  const changed = updateQuestion(document.questions, "SAL_HAB_01", { ...document.questions[hab], id: "SAL_HAB_99" });
  assert.equal(changed.find((q) => q.id === "SAL_HAB_99").text, document.questions[hab].text);
  assert.throws(() => updateQuestion(document.questions, "SAL_HAB_01", { ...document.questions[hab], id: "SAL_HAB_02" }), /duplicado/i);
});

test("fixed scoring IDs cannot be removed and context references are checked", () => {
  const state = snapshot();
  state.document.questions = deleteQuestion(state.document.questions, "FIN_CTX_04");
  assert.match(validateEditorSnapshot(state).join(" "), /FIN_CTX_04/);
  state.document.questions = structuredClone(document.questions);
  state.rules.salud.contextRules[0].questionId = "missing";
  assert.match(validateEditorSnapshot(state).join(" "), /missing/);
});

test("response scales reject missing keys and invalid scoring options", () => {
  const state = { ...snapshot(), scales: structuredClone(scales) };
  delete state.scales.frequency_5_positive;
  assert.match(validateEditorSnapshot(state).join(" "), /escala/i);
  state.scales = structuredClone(scales);
  state.scales.frequency_5_positive.options[0].score = "incorrecto";
  assert.match(validateEditorSnapshot(state).join(" "), /score|puntuaci/i);
  state.scales = structuredClone(scales);
  state.document.questions[hab].options = [{ value: "inexistente", label: "Nunca" }];
  assert.match(validateEditorSnapshot(state).join(" "), /opciones/i);
});

test("missing or duplicate internal identities cannot be persisted", () => {
  const state = snapshot();
  delete state.document.questions[hab].uid;
  assert.match(validateEditorSnapshot(state).join(" "), /identidad|uid/i);
  state.document.questions[hab].uid = state.document.questions[hab + 1].uid;
  assert.match(validateEditorSnapshot(state).join(" "), /identidad|uid/i);
});
