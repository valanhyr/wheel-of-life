import { createQuestionFrom } from "./question-editor.js";
import { isFixedQuestionId, updateQuestion, deleteQuestion } from "./editor-validation.js";

const replaceQuestions = (snapshot, questions, rules = snapshot.rules) => ({ ...snapshot, document: { ...snapshot.document, questions }, rules });

export function changeQuestion(snapshot, uid, replacement) {
  const previous = snapshot.document.questions.find((q) => q.uid === uid);
  if (!previous) throw new Error("La pregunta no existe.");
  if (replacement?.uid !== uid) throw new Error("La identidad interna uid no puede cambiar.");
  if (isFixedQuestionId(previous.id) && (previous.id !== replacement.id || previous.areaId !== replacement.areaId || replacement.scored !== false)) throw new Error(`${previous.id} es una referencia fija del motor de puntuación.`);
  const questions = updateQuestion(snapshot.document.questions, previous.id, replacement);
  const rules = structuredClone(snapshot.rules);
  for (const [areaId, config] of Object.entries(rules)) {
    for (const [dimension, rule] of Object.entries(config.dimensions)) {
      const index = rule.question_ids.indexOf(previous.id);
      if (index >= 0) {
        rule.question_ids.splice(index, 1);
        if (replacement.scored === true && replacement.areaId === areaId && replacement.dimension === dimension) rule.question_ids.splice(index, 0, replacement.id);
      }
    }
    // A context rule belongs to its original area; moving to a new area removes the old note, never silently transfers it.
    if (Array.isArray(config.contextRules)) {
      config.contextRules = config.contextRules.filter((rule) => rule.questionId !== previous.id || (replacement.areaId === areaId && replacement.scored === false));
      for (const rule of config.contextRules) if (rule.questionId === previous.id) rule.questionId = replacement.id;
    }
  }
  if (replacement.scored === true) {
    const target = rules[replacement.areaId]?.dimensions?.[replacement.dimension];
    if (!target) throw new Error("Selecciona una dimensión puntuable registrada en el área.");
    if (!target.question_ids.includes(replacement.id)) target.question_ids.push(replacement.id);
  }
  return replaceQuestions(snapshot, questions, rules);
}

export function removeQuestion(snapshot, uid) {
  const previous = snapshot.document.questions.find((q) => q.uid === uid);
  if (!previous) throw new Error("La pregunta no existe.");
  if (isFixedQuestionId(previous.id)) throw new Error(`${previous.id} es una referencia fija del motor de puntuación.`);
  const rules = structuredClone(snapshot.rules);
  for (const config of Object.values(rules)) {
    for (const dimension of Object.values(config.dimensions)) dimension.question_ids = dimension.question_ids.filter((id) => id !== previous.id);
    if (config.contextRules) config.contextRules = config.contextRules.filter((rule) => rule.questionId !== previous.id);
  }
  return replaceQuestions(snapshot, deleteQuestion(snapshot.document.questions, previous.id), rules);
}

export function createQuestion(snapshot, templateId, text) {
  const questions = createQuestionFrom(snapshot.document.questions, templateId, text);
  const question = questions.at(-1);
  const rules = structuredClone(snapshot.rules);
  if (question.scored === true) {
    const target = rules[question.areaId]?.dimensions?.[question.dimension];
    if (!target) throw new Error("La dimensión puntuable no está registrada.");
    target.question_ids.push(question.id);
  }
  return replaceQuestions(snapshot, questions, rules);
}

export function duplicateScale(snapshot, uid) {
  const question = snapshot.document.questions.find((q) => q.uid === uid);
  if (!question?.responseScale || !snapshot.scales[question.responseScale]) throw new Error("Esta pregunta no usa una escala compartida.");
  const base = `${question.responseScale}_copia`;
  let key = base;
  let index = 2;
  while (snapshot.scales[key]) key = `${base}_${index++}`;
  const next = changeQuestion(snapshot, uid, { ...question, responseScale: key });
  return { snapshot: { ...next, scales: { ...snapshot.scales, [key]: structuredClone(snapshot.scales[question.responseScale]) } }, key };
}

export function changeScale(snapshot, key, scale) {
  if (!snapshot.scales[key]) throw new Error("La escala no existe.");
  return { ...snapshot, scales: { ...snapshot.scales, [key]: structuredClone(scale) } };
}
