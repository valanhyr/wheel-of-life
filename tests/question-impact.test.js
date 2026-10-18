import test from "node:test";
import assert from "node:assert/strict";
import document from "../src/data/questions.json" with { type: "json" };
import health from "../src/data/health-rules.json" with { type: "json" };
import scales from "../src/data/response-scales.json" with { type: "json" };
import fixture from "./fixtures/health-demo.json" with { type: "json" };
import { questionImpact } from "../src/data/question-impact.js";
import { changeQuestion, createQuestion, duplicateScale, changeScale } from "../src/data/question-operations.js";

const baseline = () => ({ document: structuredClone(document), rules: { salud: structuredClone(health) }, scales: structuredClone(scales) });
const answers = { salud: fixture.answers };

test("editorial change leaves fixture score comparable, rename keeps response via uid", () => {
  const start = baseline();
  const q = start.document.questions.find((item) => item.id === "SAL_HAB_01");
  const renamed = changeQuestion(start, q.uid, { ...q, id: "SAL_HAB_99", text: "Nuevo texto" });
  const impact = questionImpact(start, renamed, answers);
  assert.deepEqual(impact.renamed, [{ from: "SAL_HAB_01", to: "SAL_HAB_99" }]);
  assert.deepEqual(impact.areas, ["salud"]);
  assert.ok(impact.fixtures.salud.before != null);
  assert.ok(Math.abs(impact.fixtures.salud.before - fixture.expected.score) < 1e-10);
  assert.equal(impact.fixtures.salud.after, impact.fixtures.salud.before);
});

test("new scored item is non-comparable until answered; shared scale lists consumers and changes score", () => {
  const start = baseline();
  const added = createQuestion(start, "SAL_HAB_01", "Nueva");
  assert.equal(questionImpact(start, added, answers).fixtures.salud.after, null);
  const q = start.document.questions.find((item) => item.id === "SAL_HAB_01");
  const { snapshot: copy, key } = duplicateScale(start, q.uid);
  const updated = changeScale(copy, key, { ...copy.scales[key], options: copy.scales[key].options.map((option) => ({ ...option, score: 10 })) });
  const impact = questionImpact(start, updated, answers);
  assert.equal(impact.scaleChanges[0].usersBefore, 0);
  assert.equal(impact.scaleChanges[0].usersAfter, 1);
  assert.notEqual(impact.fixtures.salud.after, impact.fixtures.salud.before);
});
