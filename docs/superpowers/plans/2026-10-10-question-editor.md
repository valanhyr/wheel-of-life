# Implementation Plan: Editor de preguntas

> Plan governing spec: `docs/superpowers/specs/2026-10-10-question-editor.md`
>
> Estado: ejecución local. No hay integración Trello disponible; registrar esa limitación en el ledger.

## Task 1 — Modelo de borrador y exportación
- Archivos: `src/data/question-editor.js`, `tests/question-editor.test.js`.
- Interfaces: `updateQuestionText`, `createQuestionFrom`, `restoreDraft`, `exportQuestions` sobre el documento original.
- RED: `node --test tests/question-editor.test.js` (módulo ausente).
- GREEN: `node --test tests/question-editor.test.js`; `npm test`; `npm run build`.
- Commit boundary: `feat: add safe question draft model` (no crear commit automáticamente).

## Task 2 — Vista editorial integrada
- Archivos: `src/QuestionEditor.jsx`, `src/App.jsx`, `src/index.css`, `tests/question-editor-rendering.test.js`.
- Interfaces: pantalla editorial con selección de área, filtro, listado, formulario editar/crear, exportar y descartar; navegación de cabecera.
- RED: `node --test tests/question-editor-rendering.test.js` (vista ausente).
- GREEN: `node --test tests/question-editor-rendering.test.js`; `npm test`; `npm run build`.
- Commit boundary: `feat: add question editor view` (no crear commit automáticamente).

## Revisión
Revisar contratos de IDs, campos preservados, aislamiento del cuestionario y estado de exportación; registrar resultados y limitaciones en `.superpowers/sdd/2026-10-10-question-editor/progress.md`.
