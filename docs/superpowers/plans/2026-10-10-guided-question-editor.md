# Implementation Plan: Editor guiado del cuestionario

> Plan governing spec: `docs/superpowers/specs/2026-10-10-guided-question-editor.md`
>
> Estado: ejecución local. Si una implementación contradice la spec, prevalece la spec.

## Task 1 — Identidad estable y operaciones transaccionales
- Archivos: `src/data/questions.json`, `src/data/editor-validation.js`, `src/data/question-operations.js`, `src/data/question-editor.js`, `tests/question-operations.test.js`, `tests/editor-validation.test.js`, `tests/question-editor.test.js`.
- Interfaces: `uid` inmutable, `createQuestion`, `changeQuestion`, `removeQuestion`, `duplicateScale`, `changeScale`; snapshot `{document,rules,scales}`.
- RED: `node --test tests/question-operations.test.js tests/editor-validation.test.js` con casos para referencias, cambio de tipo/área, UID y escala.
- GREEN: mismo comando; `npm test`; `npm run build`.
- Commit boundary: `feat: add stable question identity and safe operations` (no commit automático).

## Task 2 — Impacto y validación de guardado
- Archivos: `src/data/question-impact.js`, `tests/question-impact.test.js`, `server/question-editor-api.js`, `tests/question-editor-api.test.js`.
- Interfaces: `questionImpact(baseline,next,fixtures)`; `PUT` exige UID y snapshot íntegro; hashes de revisión.
- RED: `node --test tests/question-impact.test.js tests/question-editor-api.test.js`.
- GREEN: mismo comando; `npm test`; `npm run build`.
- Commit boundary: `feat: review question impact before persistence`.

## Task 3 — Interfaz guiada y revisión
- Archivos: `src/QuestionEditor.jsx`, `src/index.css`, `tests/question-editor-rendering.test.js`.
- Interfaces: formulario por campos, controles de escala compartida/duplicada, panel de impacto y confirmación; JSON avanzado como alternativa.
- RED: `node --test tests/question-editor-rendering.test.js` con controles y vista de revisión.
- GREEN: mismo comando; `npm test`; `npm run build`.
- Commit boundary: `feat: guide question edits with impact review`.

## Cierre
Revisar operaciones, referencias, pruebas de API y exclusión del editor del bundle productivo. Anotar evidencia y límites en `.superpowers/sdd/2026-10-10-guided-question-editor/progress.md`.
