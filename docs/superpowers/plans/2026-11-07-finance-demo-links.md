# Finance demo links implementation plan

> **For agent:** Follow red/green/refactor, task review and full-branch review. Governing spec: `docs/superpowers/specs/2026-11-07-finance-demo-links.md` (extension of finance resource routes spec).

## Task 1 — Demo dev-only en resultados de Finanzas
Files: `src/FinanceRecommendations.jsx`, `src/data/finance-demo-resources.js`, `src/index.css`, `tests/finance-recommendations-rendering.test.js`. Interfaces: render conditional on `import.meta.env.DEV`; keep demo data outside `finance-resources.json`; no change to `resourcesForRoute`. RED: `node --test tests/finance-recommendations-rendering.test.js` must fail for missing dev cards. GREEN: same focused command and `npm test`. Commit boundary: one self-contained feature, do not commit without request.

## Task 2 — Verificación y revisión
Files: `.superpowers/sdd/2026-11-07-finance-demo-links/progress.md`. Run `npm test`, `npm run build`, `git diff --check`; inspect build for demo sentinel and confirm production paths are absent. Review against spec and avoid modifying pre-existing uncommitted pilot files beyond relevant integration. Commit boundary: none.

No Trello sync requested. Skills `superpowers:*` and `frontend-design` unavailable in current runtime; use the documented process without claiming to have loaded them.
