import test from "node:test";
import assert from "node:assert/strict";
import { suggestFinanceRoute, financeRoutes, resourcesForRoute } from "../src/data/finance-recommendations.js";

const detail = (control, safety, habits, future, complete = true) => ({
  complete,
  dimensions: [
    { name: "Control", score: control },
    { name: "Seguridad", score: safety },
    { name: "Hábitos financieros", score: habits },
    { name: "Proyección", score: future },
  ],
});

test("finance route waits for complete evidence", () => {
  assert.equal(suggestFinanceRoute(detail(3, 5, 7, 7, false), {}).id, null);
});

test("urgent context takes precedence, but never selects an investment product", () => {
  for (const answers of [
    { FIN_CTX_01: "no_siempre" }, { FIN_CTX_01: "no" },
    { FIN_CTX_02: "si_condicionan" }, { FIN_CTX_03: "empeorado_algo" },
    { FIN_CTX_03: "empeorado_bastante" },
  ]) {
    assert.equal(suggestFinanceRoute(detail(7, 4, 6, 5), answers).id, "stabilize");
  }
});

test("prerequisites beat the lowest score", () => {
  assert.equal(suggestFinanceRoute(detail(5.5, 8, 8, 3), {}).id, "organize");
  assert.equal(suggestFinanceRoute(detail(3, 7, 7, 5), {}).id, "organize");
  assert.equal(suggestFinanceRoute(detail(7, 4, 5, 3), {}).id, "save");
  assert.equal(suggestFinanceRoute(detail(8, 8, 7, 4), {}).id, "grow");
});

test("no dominant signal leaves choice to the person", () => {
  assert.equal(suggestFinanceRoute(detail(6, 7, 7.4, 6.2), {}).id, null);
  assert.equal(suggestFinanceRoute(detail(8, 8, 8, 8), {}).id, null);
});

test("explicit concerns in the questionnaire guide otherwise ambiguous scores", () => {
  const balanced = detail(7, 7, 7, 7);
  assert.equal(suggestFinanceRoute(balanced, { FIN_CTX_04: "futuro" }).id, "grow");
  assert.equal(suggestFinanceRoute(balanced, { FIN_CTX_04: "falta_ahorro" }).id, "save");
  assert.equal(suggestFinanceRoute(balanced, { FIN_CTX_04: "dia_a_dia" }).id, "organize");
  assert.equal(suggestFinanceRoute(balanced, { FIN_CTX_04: "deudas" }).id, "stabilize");
  assert.equal(suggestFinanceRoute(detail(5, 8, 8, 3), { FIN_CTX_04: "futuro" }).id, "organize");
});

test("four routes expose curated tools, books, optional next steps and transparent external links", () => {
  assert.deepEqual(financeRoutes.map((route) => route.id), ["stabilize", "organize", "save", "grow"]);
  for (const route of financeRoutes) {
    assert.ok(route.title && route.description && route.steps.length > 1);
    const { tools, books } = resourcesForRoute(route.id);
    assert.ok(tools.length > 0 && books.length > 0, route.id);
    for (const resource of [...tools, ...books]) {
      assert.ok(resource.id && resource.title && resource.description && resource.provider && resource.level && resource.reviewedAt);
      assert.ok(["free", "paid"].includes(resource.cost));
      assert.equal(resource.affiliate, false);
      assert.equal(typeof resource.registrationRequired, "boolean");
      assert.equal(new URL(resource.url).protocol, "https:");
      assert.ok(resource.tags.includes(route.id));
    }
  }
});

test("resource dismissal is session-local input and cannot introduce an unknown route", () => {
  const initial = resourcesForRoute("organize");
  const first = initial.tools[0];
  assert.ok(!resourcesForRoute("organize", [first.id]).tools.some((r) => r.id === first.id));
  assert.ok(resourcesForRoute("organize").tools.some((r) => r.id === first.id));
  assert.deepEqual(resourcesForRoute("unknown"), { tools: [], books: [] });
});
