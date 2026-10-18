import original from "./questions.json" with { type: "json" };
import responseScales from "./response-scales.json" with { type: "json" };

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;

export function updateQuestion(questions, oldId, replacement) {
  const index = questions.findIndex((q) => q.id === oldId);
  if (index < 0) throw new Error("La pregunta no existe.");
  if (!object(replacement) || !nonempty(replacement.id) || questions.some((q, i) => i !== index && q.id === replacement.id)) throw new Error("ID vacío o duplicado.");
  return questions.map((q, i) => i === index ? structuredClone(replacement) : q);
}

export function deleteQuestion(questions, id) {
  if (!questions.some((q) => q.id === id)) throw new Error("La pregunta no existe.");
  return questions.filter((q) => q.id !== id);
}

// These IDs are read directly by scoring.js; changing them requires a separate scoring migration.
const fixedIds = [
  ...["SAL", "EMO", "REL", "FAM", "TRA", "FIN", "CRE", "OCI"].flatMap((prefix) => [
    `${prefix}_IMP_01`, `${prefix}_CTX_04`,
  ]),
  ...["FIN", "TRA"].flatMap((prefix) => [1, 2, 3].map((n) => `${prefix}_CTX_0${n}`)),
];
export const isFixedQuestionId = (id) => fixedIds.includes(id);

export function validateEditorSnapshot(snapshot) {
  const errors = [];
  if (!object(snapshot) || !object(snapshot.document) || !Array.isArray(snapshot.document.questions) || !object(snapshot.rules)) return ["El documento y las reglas deben ser objetos JSON válidos."];
  const { document, rules } = snapshot;
  const scales = snapshot.scales ?? responseScales;
  if (!object(scales)) return ["Las escalas deben ser un objeto JSON válido."];
  for (const [name, scale] of Object.entries(scales)) {
    if (!object(scale)) { errors.push(`Escala ${name}: configuración inválida.`); continue; }
    if (scale.type === "single_select") {
      if (!Array.isArray(scale.options) || scale.options.length === 0 || scale.options.some((option) => !object(option) || !nonempty(option.label) || (typeof option.value !== "string" && typeof option.value !== "number") || typeof option.score !== "number" || !Number.isFinite(option.score) || option.score < 0 || option.score > 10) || new Set(scale.options.map((option) => option.value)).size !== scale.options.length) errors.push(`Escala ${name}: opciones o score inválidos (0–10).`);
    } else if (scale.type === "rating") {
      if (typeof scale.min !== "number" || typeof scale.max !== "number" || scale.max <= scale.min || !positive(scale.step) || typeof scale.invert !== "boolean") errors.push(`Escala ${name}: rango, paso o inversión inválidos.`);
    } else errors.push(`Escala ${name}: tipo desconocido.`);
  }
  if (!Array.isArray(document.areas) || document.areas.length !== original.areas.length || document.areas.some((a, i) => a.id !== original.areas[i].id)) errors.push("No se pueden modificar las áreas desde este editor.");
  const areas = new Map(original.areas.map((a) => [a.id, a]));
  const ids = new Set();
  const uids = new Set();
  for (const q of document.questions) {
    if (!object(q) || !nonempty(q.id)) { errors.push("Cada pregunta necesita un ID."); continue; }
    if (!nonempty(q.uid) || uids.has(q.uid)) errors.push(`${q.id}: identidad uid ausente o duplicada.`);
    uids.add(q.uid);
    if (ids.has(q.id)) errors.push(`ID duplicado: ${q.id}.`);
    ids.add(q.id);
    const area = areas.get(q.areaId);
    if (!area) errors.push(`${q.id}: área desconocida.`);
    if (!nonempty(q.text)) errors.push(`${q.id}: enunciado vacío.`);
    if (!nonempty(q.dimension)) errors.push(`${q.id}: dimensión vacía.`);
    if (q.scored !== true && q.scored !== false) errors.push(`${q.id}: scored debe ser booleano.`);
    if (q.required !== true && q.required !== false) errors.push(`${q.id}: required debe ser booleano.`);
    if (!positive(q.dimensionWeight)) errors.push(`${q.id}: dimensionWeight debe ser positivo.`);
    if (!Array.isArray(q.factors) || !object(q.factorWeights) || q.factors.some((f) => !nonempty(f) || !positive(q.factorWeights[f])) || Object.keys(q.factorWeights ?? {}).some((f) => !q.factors?.includes(f))) errors.push(`${q.id}: factores y pesos inválidos.`);
    if ((q.responseScale && !scales[q.responseScale]) || (!q.responseScale && (q.scored === true || !Array.isArray(q.options)))) errors.push(`${q.id}: escala de respuesta desconocida.`);
    if (Array.isArray(q.options) && (q.options.length === 0 || q.options.some((o) => !object(o) || !nonempty(o.label) || o.value === undefined))) errors.push(`${q.id}: opciones inválidas.`);
    if (q.scored === true && Array.isArray(q.options) && scales[q.responseScale]) {
      const scale = scales[q.responseScale];
      const count = positive(scale.step) && Number.isFinite(scale.min) && Number.isFinite(scale.max) ? Math.floor((scale.max - scale.min) / scale.step) + 1 : 0;
      const valid = Array.isArray(scale.options) ? scale.options.map((option) => option.value) : count > 0 && count < 1000 ? Array.from({ length: count }, (_, i) => scale.min + i * scale.step) : [];
      if (q.options.some((option) => !valid.includes(option.value))) errors.push(`${q.id}: opciones incompatibles con la escala de puntuación.`);
    }
    if (q.polarity !== "positiva" && q.polarity !== "negativa") errors.push(`${q.id}: polaridad inválida.`);
  }
  for (const id of fixedIds) {
    const q = document.questions.find((item) => item.id === id);
    const previous = original.questions.find((item) => item.id === id);
    if (!q || !previous || q.areaId !== previous.areaId || q.scored !== false || (id.endsWith("_CTX_04") && !Array.isArray(q.options))) errors.push(`${id}: referencia fija en scoring.js; conserva ID, área, tipo y opciones (o migra el código).`);
  }
  for (const [areaId, rule] of Object.entries(rules)) {
    if (!areas.has(areaId)) { errors.push(`Reglas del área ${areaId} desconocida.`); continue; }
    if (!object(rule) || !object(rule.dimensions)) { errors.push(`${areaId}: faltan dimensiones en las reglas.`); continue; }
    if (Object.keys(rule.dimensions).sort().join() !== [...areas.get(areaId).dimensions].sort().join()) errors.push(`${areaId}: las cuatro dimensiones deben mantenerse en las reglas.`);
    if (!Array.isArray(rule.focusOrder) || [...rule.focusOrder].sort().join() !== [...areas.get(areaId).dimensions].sort().join()) errors.push(`${areaId}: focusOrder debe contener las cuatro dimensiones.`);
    const mapped = new Set();
    for (const [dimension, config] of Object.entries(rule.dimensions)) {
      if (!areas.get(areaId).dimensions.includes(dimension)) errors.push(`${areaId}: dimensión ${dimension} no registrada en el área.`);
      if (!Array.isArray(config?.question_ids) || config.question_ids.length === 0) { errors.push(`${areaId}/${dimension}: faltan question_ids.`); continue; }
      for (const id of config.question_ids) {
        if (mapped.has(id)) errors.push(`${id}: aparece más de una vez en reglas.`);
        mapped.add(id);
        const q = document.questions.find((item) => item.id === id);
        if (!q || q.areaId !== areaId || q.dimension !== dimension || q.scored !== true) errors.push(`${id}: referencia puntuable incorrecta en ${areaId}/${dimension}.`);
      }
      if (!positive(rule.dimensionWeights?.[dimension])) errors.push(`${areaId}/${dimension}: peso de dimensión inválido.`);
    }
    for (const q of document.questions.filter((item) => item?.areaId === areaId && item.scored === true)) if (!mapped.has(q.id)) errors.push(`${q.id}: pregunta puntuable sin referencia en las reglas.`);
    for (const context of rule.contextRules ?? []) {
      const q = document.questions.find((item) => item.id === context.questionId);
      if (!q || q.areaId !== areaId || q.scored !== false) errors.push(`${context.questionId}: referencia de contexto inexistente en ${areaId}.`);
    }
  }
  return errors;
}
