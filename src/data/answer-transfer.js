import { areas, questions, optionsFor } from "./scoring.js";

export const MAX_PROGRESS_FILE_SIZE = 1024 * 1024;
const format = "wheel-of-life-progress";
const version = 1;
const byId = new Map(questions.map((question) => [question.id, question]));
const byUid = new Map(questions.map((question) => [question.uid, question]));

function validValue(question, value) {
  return (typeof value === "string" || (typeof value === "number" && Number.isFinite(value)))
    && optionsFor(question).some((option) => option.value === value);
}

function validatePerceptions(perceptions) {
  if (!perceptions || typeof perceptions !== "object" || Array.isArray(perceptions)
    || Object.keys(perceptions).length !== areas.length
    || areas.some(({ id }) => !Object.hasOwn(perceptions, id) || !Number.isInteger(perceptions[id]) || perceptions[id] < 0 || perceptions[id] > 10)) {
    throw new Error("Las valoraciones de las áreas no son válidas.");
  }
}

export function exportProgress(answers, selfEval) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers) || !Array.isArray(selfEval) || selfEval.length !== areas.length) {
    throw new Error("El progreso no es válido.");
  }
  const perceptions = Object.fromEntries(areas.map(({ id }, index) => [id, selfEval[index]]));
  validatePerceptions(perceptions);
  const savedAnswers = Object.entries(answers).map(([id, value]) => {
    const question = byId.get(id);
    if (!question || !validValue(question, value)) throw new Error("Hay una respuesta incompatible con el cuestionario actual.");
    return [question.uid, value];
  });
  return JSON.stringify({ format, version, exportedAt: new Date().toISOString(), answers: savedAnswers, perceptions }, null, 2);
}

export function importProgress(text) {
  if (typeof text !== "string" || text.length > MAX_PROGRESS_FILE_SIZE) throw new Error("El archivo JSON es demasiado grande o no es válido.");
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("El archivo no contiene JSON válido."); }
  if (!data || typeof data !== "object" || Array.isArray(data) || data.format !== format || data.version !== version || !Array.isArray(data.answers) || data.answers.length > questions.length) {
    throw new Error("El formato o la versión del archivo no son compatibles.");
  }
  validatePerceptions(data.perceptions);
  const answers = {};
  const seen = new Set();
  for (const entry of data.answers) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || seen.has(entry[0])) {
      throw new Error("El archivo contiene respuestas duplicadas o incorrectas.");
    }
    seen.add(entry[0]);
    const question = byUid.get(entry[0]);
    if (!question || !validValue(question, entry[1])) {
      throw new Error("Una pregunta o respuesta ya no es compatible con el cuestionario actual.");
    }
    answers[question.id] = entry[1];
  }
  return { answers, selfEval: areas.map(({ id }) => data.perceptions[id]) };
}
