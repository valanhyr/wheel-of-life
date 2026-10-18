import test from "node:test";
import assert from "node:assert/strict";
import { questions, optionsFor } from "../src/data/scoring.js";

const priorityQuestions = questions.filter((question) => ["Prioridades", "Prioridades personales"].includes(question.dimension));

test("every priority question uses whole numbers from 1 to 10", () => {
  assert.equal(priorityQuestions.length, 8);
  for (const question of priorityQuestions) {
    assert.equal(question.responseScale, "priority_1_10", question.id);
    assert.deepEqual(optionsFor(question).map((option) => option.value), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  }
});
