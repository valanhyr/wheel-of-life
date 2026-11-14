# Answer JSON transfer implementation plan

> **For agent:** Follow RED/GREEN/refactor, task review and whole-branch review. Governing spec: `docs/superpowers/specs/2026-11-08-answer-json-transfer.md`. `superpowers:*` and `frontend-design` skills did not load in this environment; apply their repository workflow without claiming to have used them.

## Task 1 — Portable format and validation
Files: `src/data/answer-transfer.js`, `tests/answer-transfer.test.js`. Interfaces: `exportProgress(answers, selfEval)`, `importProgress(text)`; UID/value pairs, schema version, catalog-based validation and strict rejection. RED: `node --test tests/answer-transfer.test.js` fails for absent module. GREEN: same command and `npm test`. Commit boundary: pure codec + tests (do not commit without user request).

## Task 2 — Manual export/import controls
Files: `src/App.jsx`, `src/index.css`, `tests/answer-transfer-rendering.test.js`. Interfaces: header buttons and hidden file input, file download, size limit, confirmation, error/status feedback and safe state restoration. RED: `node --test tests/answer-transfer-rendering.test.js` fails for missing controls. GREEN: same command and `npm test`. Commit boundary: UI + tests (do not commit without user request).

## Task 3 — Whole-branch review and verification
Files: `.superpowers/sdd/2026-11-08-answer-json-transfer/progress.md`. Review against spec, `npm test`, `npm run build`, `git diff --check`, `git status --short`. Commit boundary: none. No Trello sync requested.
