import data from "./questions.json";
import guidance from "./actions.json";

export const { areas, questions, scales, thresholds } = data;
export const { interpretation, priority: priorityRules, gapPrompts, animals, shed } = guidance;

export const areaIndexById = Object.fromEntries(areas.map((a, i) => [a.id, i]));

/**
 * Convierte una respuesta bruta a escala 0-10 aplicando polaridad.
 * - frecuencia: mapa de la escala (positiva o negativa)
 * - valoracion_1_10: (v - 1) * 10 / 9, invertida si la polaridad es negativa
 */
export function scoreAnswer(question, raw) {
  if (raw == null) return null;

  if (question.type === "frecuencia") {
    const map = question.polarity === "negativa" ? scales.frecuencia.negative : scales.frecuencia.positive;
    const value = map[raw];
    return value == null ? null : value;
  }

  const normalized = ((Number(raw) - 1) * 10) / 9;
  return question.polarity === "negativa" ? 10 - normalized : normalized;
}

export function optionsFor(question) {
  if (question.type === "frecuencia") {
    return scales.frecuencia.options.map((label) => ({ value: label, label }));
  }
  return Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
}

const round1 = (n) => Math.round(n * 10) / 10;

/** Media 0-10 por área a partir de las respuestas contestadas. */
export function areaScores(answers) {
  return areas.map((area) => {
    const own = questions.filter((q) => q.areaId === area.id);
    const scored = own.map((q) => scoreAnswer(q, answers[q.id])).filter((s) => s != null);
    if (!scored.length) return null;
    return round1(scored.reduce((a, b) => a + b, 0) / scored.length);
  });
}

/**
 * Nivel del resultado en sí, independiente de la percepción.
 * Por debajo del umbral de prioridad (7) el área pide atención aunque
 * coincida con lo que la persona percibía.
 */
export function scoreLevel(result) {
  if (result == null) return { key: "none", label: "Sin responder", tone: "none" };
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
export function gapStatus(result, perception) {
  if (result == null) return { key: "none", gap: null, dir: "none", strength: "soft", label: "Sin responder" };

  const gap = round1(result - perception);
  const abs = Math.abs(gap);

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
      level: scoreLevel(scores[i]),
      gap: gapStatus(scores[i], selfEval[i]),
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
