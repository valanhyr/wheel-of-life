# Finance resource routes implementation plan

> **For agent:** Execute tasks sequentially with red/green/refactor, review each task and run full verification. Governing spec: `docs/superpowers/specs/2026-11-01-finance-resource-routes.md`.

## Task 1 — Selección pura de ruta
Files: `src/data/finance-recommendations.js`, `tests/finance-recommendations.test.js`. Interface: `suggestFinanceRoute(detail, answers)` returns route ID or null and explanation signal. RED: `node --test tests/finance-recommendations.test.js` fails on missing module. GREEN: run same command, then `npm test`. Commit boundary: selector plus scenarios.

## Task 2 — Catálogo curado y filtros
Files: `src/data/finance-resources.json`, `src/data/finance-recommendations.js`, `tests/finance-recommendations.test.js`. Interface: `resourcesForRoute(routeId, dismissedIds)` returns categorized resources. RED: extend focused tests and run `node --test tests/finance-recommendations.test.js`; GREEN: implement catalog/filter and run focused then `npm test`. Commit boundary: catalog, metadata checks and selection.

## Task 3 — Integración visual en resultados
Files: `src/FinanceRecommendations.jsx`, `src/App.jsx`, `src/index.css`, `tests/finance-recommendations-rendering.test.js`. Interface: `<FinanceRecommendations result={...} answers={...} />` shown in completed finance summary only. RED: `node --test tests/finance-recommendations-rendering.test.js` fails; GREEN: add UI and styles, run focused then `npm test`. Commit boundary: UI and render tests.

## Task 4 — Revisión final
Files: plan ledger `.superpowers/sdd/2026-11-01-finance-resource-routes/progress.md`; verify `npm test`, `npm run build`, `git diff --check`, review against spec and report any pending commercial URLs or email configuration. Commit boundary: none (do not commit unless requested).

No Trello sync without explicit user request. Skills `superpowers:*` and `frontend-design` were requested but unavailable in this runtime; follow their required workflow as closely as possible without claiming to have loaded them.
