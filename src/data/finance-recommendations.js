import catalog from "./finance-resources.json" with { type: "json" };

export const financeRoutes = catalog.routes;

export function resourcesForRoute(routeId, dismissedIds = []) {
  if (!financeRoutes.some(({ id }) => id === routeId)) return { tools: [], books: [] };
  const visible = catalog.resources.filter((r) => r.tags.includes(routeId) && !dismissedIds.includes(r.id));
  return { tools: visible.filter((r) => r.kind === "tool"), books: visible.filter((r) => r.kind === "book") };
}

/** Guidance is independent of scoring: it never modifies an area result. */
export function suggestFinanceRoute(detail, answers = {}) {
  if (!detail?.complete) return { id: null, reason: null };
  if (["no_siempre", "no"].includes(answers.FIN_CTX_01)
    || answers.FIN_CTX_02 === "si_condicionan"
    || ["empeorado_algo", "empeorado_bastante"].includes(answers.FIN_CTX_03)) {
    return { id: "stabilize", reason: "Tus respuestas sobre la situación actual sugieren empezar por reforzar tu margen. Puedes explorar cualquier otra ruta." };
  }
  const dimensions = Object.fromEntries(detail.dimensions.map(({ name, score }) => [name, score]));
  if (dimensions.Control < 6) return { id: "organize", reason: "La claridad sobre ingresos y gastos podría ser una base útil antes de otros objetivos." };
  if (dimensions.Seguridad < 6 || dimensions["Hábitos financieros"] < 6) {
    return { id: "save", reason: "Tus respuestas sugieren que podrías reforzar la reserva o la constancia del ahorro." };
  }
  if (dimensions.Proyección < 6) return { id: "grow", reason: "Con la base cotidiana más afianzada, podrías explorar tus objetivos de futuro." };
  const interests = {
    dia_a_dia: "organize", ingresos: "stabilize", deudas: "stabilize",
    falta_ahorro: "save", imprevistos: "save", futuro: "grow",
  };
  if (interests[answers.FIN_CTX_04]) {
    return { id: interests[answers.FIN_CTX_04], reason: "Esta ruta se relaciona con la preocupación que elegiste en el cuestionario; puedes elegir otra." };
  }
  return { id: null, reason: null };
}
