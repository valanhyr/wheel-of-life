import data from "./questions.json" with { type: "json" };
import guidance from "./actions.json" with { type: "json" };
import responseScales from "./response-scales.json" with { type: "json" };
import financeCatalog from "./finance-results.json" with { type: "json" };
import financeRules from "./finance-rules.json" with { type: "json" };
import workCatalog from "./work-results.json" with { type: "json" };
import workRules from "./work-rules.json" with { type: "json" };
import { additionalAreas } from "./additional-areas.js";

export const { areas, questions, scales, thresholds } = data;
export const { interpretation, priority: priorityRules, gapPrompts, animals, shed } = guidance;

export const areaIndexById = Object.fromEntries(areas.map((a, i) => [a.id, i]));

/**
 * Convierte una respuesta bruta a escala 0-10 aplicando polaridad.
 * - frecuencia: mapa de la escala (positiva o negativa)
 * - valoracion_1_10: (v - 1) * 10 / 9, invertida si la polaridad es negativa
 */
export function scoreAnswer(question, raw) {
  if (raw == null || question.scored === false) return null;
  if (question.responseScale) {
    const scale = responseScales[question.responseScale];
    if (scale.options) return scale.options.find((option) => option.value === raw)?.score ?? null;
    if (typeof raw !== "number" || !optionsFor(question).some((option) => option.value === raw)) return null;
    const value = ((raw - scale.min) * 10) / (scale.max - scale.min);
    return scale.invert ? 10 - value : value;
  }
  if (!optionsFor(question).some((option) => option.value === raw)) return null;

  if (question.type === "frecuencia") {
    const map = question.polarity === "negativa" ? scales.frecuencia.negative : scales.frecuencia.positive;
    const value = map[raw];
    return value == null ? null : value;
  }

  const normalized = ((Number(raw) - 1) * 10) / 9;
  return question.polarity === "negativa" ? 10 - normalized : normalized;
}

export function optionsFor(question) {
  if (question.options) return question.options;
  if (question.responseScale) {
    const scale = responseScales[question.responseScale];
    if (scale.options) return scale.options;
    return Array.from({ length: Math.round((scale.max - scale.min) / scale.step) + 1 }, (_, i) => {
      const value = scale.min + i * scale.step;
      return { value, label: String(value) };
    });
  }
  if (question.type === "frecuencia") {
    return scales.frecuencia.options.map((label) => ({ value: label, label }));
  }
  return Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
}

const round1 = (n) => Math.round(n * 10) / 10;

/** Nota 0-10 por área; se publica al completar sus 22 preguntas puntuables. */
export function areaScores(answers) {
  return areas.map((area) => detailedResult(area.id, answers).score);
}

/**
 * Nivel del resultado en sí, independiente de la percepción.
 * Por debajo de 7,5 el área tiene margen de mejora aunque
 * coincida con lo que la persona percibía.
 */
export function scoreLevel(result, areaId) {
  if (result == null) return { key: "none", label: "Sin responder", tone: "none" };
  const band = areaBand(areaId, result);
  if (band) {
    return { key: band.id, label: band.label, tone: band.id === "critical" ? "danger" : band.id === "stable" ? "ok" : "warn" };
  }
  if (result < thresholds.critical_score) return { key: "alta", label: "Prioridad alta", tone: "danger" };
  if (result < thresholds.priority_score) return { key: "atencion", label: "Necesita atención", tone: "warn" };
  return { key: "estable", label: "Estable", tone: "ok" };
}

/**
 * Brecha entre resultado y percepción.
 * - A favor (resultado > percepción): verde. Nunca es una alerta.
 * - En contra (resultado < percepción): naranja.
 * - Neutra: sin color.
 * La intensidad depende del tramo: suave por debajo de 2, marcada a partir de 2.
 */
export function gapStatus(result, perception, areaId) {
  if (result == null) return { key: "none", gap: null, dir: "none", strength: "soft", label: "Sin responder" };

  const rawGap = result - perception;
  const gap = round1(rawGap);
  const abs = Math.abs(rawGap);

  if (abs < thresholds.gap_neutral) {
    return { key: "even", gap, dir: "even", strength: "soft", label: "Coincide con tu percepción" };
  }

  const dir = gap > 0 ? "up" : "down";
  const strength = abs >= thresholds.gap_strong ? "strong" : "soft";
  const label =
    dir === "up"
      ? strength === "strong"
        ? "Bastante mejor de lo que percibías"
        : "Mejor de lo que percibías"
      : strength === "strong"
        ? "Bastante peor de lo que percibías"
        : "Algo peor de lo que percibías";

  return { key: `${dir}-${strength}`, gap, dir, strength, label };
}

/** Áreas ordenadas por prioridad: peor resultado primero, desempate por brecha en contra. */
export function priorityOrder(scores, selfEval) {
  return areas
    .map((area, i) => ({
      area,
      index: i,
      score: scores[i],
      level: scoreLevel(scores[i], area.id),
      gap: gapStatus(scores[i], selfEval[i], area.id),
    }))
    .filter((row) => row.score != null)
    .sort((a, b) => a.score - b.score || (a.gap.gap ?? 0) - (b.gap.gap ?? 0));
}

/** Banda de lectura del resultado según 07_INTERPRETACION. */
export function interpretationFor(result) {
  if (result == null) return null;
  return interpretation.find((band) => result >= band.min && result <= band.max) ?? interpretation[interpretation.length - 1];
}

/**
 * Reglas de prioridad de 06_PRIORIDAD.
 * P1/P2/P3 son excluyentes entre sí; P4 se acumula cuando la brecha llega al umbral.
 */
export function priorityFor(result, gap) {
  if (result == null) return [];
  const byId = Object.fromEntries(priorityRules.map((r) => [r.id, r]));
  const base = result <= 3 ? byId.P1 : result <= 6 ? byId.P2 : byId.P3;
  const out = [base];
  if (gap?.gap != null && Math.abs(gap.gap) >= thresholds.gap_strong) out.push(byId.P4);
  return out;
}

/** Acciones y recursos del área para el tramo del resultado. */
export function guidanceFor(areaId, result) {
  const band = interpretationFor(result);
  if (!band) return null;
  const tier = guidance.areas[areaId]?.[band.tier];
  if (!tier) return null;
  return { band, tier: band.tier, actions: tier.actions, resources: tier.resources };
}

export function financeBand(score) {
  return catalogBand(financeCatalog, score);
}

export function workBand(score) {
  return catalogBand(workCatalog, score);
}

export function areaBand(areaId, score) {
  if (areaId === "finanzas") return financeBand(score);
  if (areaId === "trabajo") return workBand(score);
  const config = additionalAreas[areaId];
  return config ? catalogBand(config.catalog, score) : null;
}

function catalogBand(catalog, score) {
  if (score == null) return null;
  return catalog.score_bands.find((b) => score >= b.min && score < (b.max_exclusive ?? Infinity));
}

const weightedMean = (rows) => rows.length ? rows.reduce((sum, row) => sum + row.score * row.weight, 0) / rows.reduce((sum, row) => sum + row.weight, 0) : null;

// Explicit predicates: catalog expressions are documentation, never executable code.
const financePatternChecks = {
  all_low: (d) => Object.values(d).every((s) => s < 6),
  all_stable: (d) => Object.values(d).every((s) => s >= 7.5),
  present_control_future_weak: (d) => d.Control >= 6 && d.Proyección < 6,
  control_good_security_weak: (d) => d.Control >= 6 && d.Seguridad < 6,
  knowledge_without_consistency: (d) => d.Control >= 6 && d["Hábitos financieros"] < 6,
  habits_good_projection_weak: (d) => d["Hábitos financieros"] >= 6 && d.Proyección < 6,
  security_weak_projection_weak: (d) => d.Seguridad < 6 && d.Proyección < 6,
};

export function financeResult(answers, perception) {
  const notes = [];
  if (["no_siempre", "no"].includes(answers.FIN_CTX_01)) notes.push(financeRules.contextNotes[0]);
  if (answers.FIN_CTX_02 === "si_condicionan") notes.push(financeRules.contextNotes[1]);
  if (["empeorado_algo", "empeorado_bastante"].includes(answers.FIN_CTX_03)) notes.push(financeRules.contextNotes[2]);
  addConcern(notes, "FIN_CTX_04", answers);
  return structuredResult(answers, perception, {
    areaId: "finanzas", areaName: "Finanzas", rules: financeRules, catalog: financeCatalog,
    patternChecks: financePatternChecks, patterns: financeCatalog.financial_patterns,
    importanceId: "FIN_IMP_01", desireId: "FIN_DES_01", notes,
  });
}

const workPatternChecks = {
  all_low: (d) => Object.values(d).every((s) => s < 6),
  all_stable: (d) => Object.values(d).every((s) => s >= 7.5),
  satisfied_conditions_weak: (d) => d.Satisfacción >= 6 && d.Condiciones < 6,
  conditions_weak_projection_weak: (d) => d.Condiciones < 6 && d.Proyección < 6,
  development_good_projection_weak: (d) => d.Desarrollo >= 6 && d.Proyección < 6,
  projection_good_development_weak: (d) => d.Proyección >= 6 && d.Desarrollo < 6,
  conditions_good_satisfaction_weak: (d) => d.Condiciones >= 6 && d.Satisfacción < 6,
};

export function workResult(answers, perception) {
  const notes = [];
  if (["busqueda", "formacion", "pausa"].includes(answers.TRA_CTX_01)) notes.push(workRules.contextNotes[0]);
  if (["algo", "mucho"].includes(answers.TRA_CTX_02)) notes.push(workRules.contextNotes[1]);
  if (["empeorado_algo", "empeorado_bastante"].includes(answers.TRA_CTX_03)) notes.push(workRules.contextNotes[2]);
  addConcern(notes, "TRA_CTX_04", answers);
  return structuredResult(answers, perception, {
    areaId: "trabajo", areaName: "Trabajo", rules: workRules, catalog: workCatalog,
    patternChecks: workPatternChecks, patterns: workCatalog.work_patterns,
    importanceId: "TRA_IMP_01", desireId: "TRA_CAM_01", notes,
  });
}

export function detailedResult(areaId, answers, perception) {
  if (areaId === "finanzas") return financeResult(answers, perception);
  if (areaId === "trabajo") return workResult(answers, perception);
  const config = additionalAreas[areaId];
  if (!config) return null;
  const { prefix, rules } = config;
  const notes = rules.contextRules
    .filter((rule) => rule.values.includes(answers[rule.questionId]))
    .map((rule) => rules.contextNotes[rule.noteIndex]);
  addConcern(notes, `${prefix}_CTX_04`, answers);
  // Only the explicit comparisons below are supported; catalog strings never run as code.
  const patternChecks = {
    all_low: (d) => Object.values(d).every((score) => score < 6),
    all_stable: (d) => Object.values(d).every((score) => score >= 7.5),
    ...Object.fromEntries(rules.patternRules.map((rule) => [rule.id, (d) => rule.all.every((condition) => {
      const score = d[condition.dimension];
      if (score == null) return false;
      if (condition.operator === "gte") return score >= condition.value;
      if (condition.operator === "lt") return score < condition.value;
      return false;
    })])),
  };
  return structuredResult(answers, perception, {
    ...config, areaId, patternChecks, notes,
    importanceId: `${prefix}_IMP_01`, desireId: `${prefix}_CAM_01`,
  });
}

function addConcern(notes, questionId, answers) {
  const concern = questions.find((q) => q.id === questionId).options.find((o) => o.value === answers[questionId]);
  if (concern && concern.value !== "ninguna") notes.push(`Tu preocupación principal: ${concern.label.toLowerCase()}.`);
}

function structuredResult(answers, perception, { areaId, areaName, rules, catalog, patternChecks, patterns, importanceId, desireId, notes }) {
  const own = questions.filter((q) => q.areaId === areaId && q.scored !== false);
  const scored = own.map((q) => ({ q, score: scoreAnswer(q, answers[q.id]) })).filter((r) => r.score != null);
  const dimensions = Object.entries(rules.dimensions).map(([name, rule]) => {
    const rows = scored.filter((r) => rule.question_ids.includes(r.q.id));
    const score = weightedMean(rows.map((r) => ({ score: r.score, weight: r.q.dimensionWeight ?? 1 })));
    const complete = rows.length === rule.question_ids.length;
    const band = catalogBand(catalog, score);
    return { name, score, complete, answered: rows.length, total: rule.question_ids.length, band,
      text: complete ? catalog.dimension_results[name][band.id] : null };
  });
  const complete = scored.length === own.length;
  // Publish an area score only when all its dimensions have complete evidence.
  const score = complete ? weightedMean(dimensions.map((d) => ({ score: d.score, weight: rules.dimensionWeights[d.name] }))) : null;
  const band = catalogBand(catalog, score);
  const d = Object.fromEntries(dimensions.map((r) => [r.name, r.score]));
  const patternId = complete ? Object.keys(patternChecks).find((id) => patternChecks[id](d)) ?? "mixed" : null;
  const minimum = complete ? Math.min(...dimensions.map((r) => r.score)) : null;
  const focus = complete ? rules.focusOrder.map((name) => dimensions.find((r) => r.name === name)).find((r) => r && r.score - minimum <= 0.25) : null;
  const gap = score == null || perception == null ? null : perception - score;
  const perceptionId = gap == null ? null : Math.abs(gap) < 1 ? "aligned" : `perception_${gap > 0 ? "higher" : "lower"}_${Math.abs(gap) >= 2 ? "high" : "moderate"}`;
  const factors = Object.keys(catalog.transversal_factor_results).map((name) => {
    const rows = scored.filter((r) => r.q.factors.includes(name));
    const value = weightedMean(rows.map((r) => ({ score: r.score, weight: r.q.factorWeights?.[name] ?? 1 })));
    return { name, score: value, count: rows.length, text: rows.length >= 2 ? catalog.transversal_factor_results[name][catalogBand(catalog, value).id] : null };
  }).filter((r) => r.count >= 2);
  return { score, complete, answered: scored.length, total: own.length, dimensions, band, focus, factors, notes,
    summary: band ? catalog.area_results[areaName][band.id] : null,
    pattern: patterns.find((p) => p.id === patternId),
    perceptionText: catalog.perception_results.find((p) => p.id === perceptionId)?.text,
    factorNote: catalog.transversal_note,
    importance: answers[importanceId], desire: answers[desireId],
    contextComplete: questions.filter((q) => q.areaId === areaId && q.scored === false).every((q) => optionsFor(q).some((option) => option.value === answers[q.id])),
  };
}
