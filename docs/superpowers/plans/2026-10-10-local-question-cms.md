# Implementation Plan: Editor local de JSON del cuestionario

> Plan governing spec: `docs/superpowers/specs/2026-10-10-local-question-cms.md`
>
> Estado: aprobado con las decisiones de seguridad e integridad proporcionadas por el usuario.

## Task 1 — Contrato de validación
- Archivos: `src/data/editor-validation.js`, `tests/editor-validation.test.js`; interfaces `validateEditorSnapshot(snapshot)` (errores en español), `createQuestionFrom`, `updateQuestion`, `deleteQuestion`.
- RED: `node --test tests/editor-validation.test.js`.
- GREEN: mismo comando, `npm test`, `npm run build`.
- Commit boundary: `feat: validate editable questionnaire snapshots` (sin commit automático).

## Task 2 — API local de escritura
- Archivos: `server/question-editor-api.js`, `vite.config.js`, `package.json`, `tests/question-editor-api.test.js`.
- Interfaces: GET/PUT `/api/editor/questions` con snapshot de documento, reglas y escalas + revision; `createQuestionEditorMiddleware` y plugin Vite `configureServer` solo local.
- RED: `node --test tests/question-editor-api.test.js`.
- GREEN: mismo comando, `npm test`, `npm run build`.
- Commit boundary: `feat: add local authoring API`.

## Task 3 — Interfaz de edición completa
- Archivos: `src/QuestionEditor.jsx`, `src/App.jsx`, `src/index.css`, `tests/question-editor-rendering.test.js`; interfaces navegación local, vista de pregunta JSON + reglas JSON + escalas JSON, eliminación y guardado servidor.
- RED: `node --test tests/question-editor-rendering.test.js` con nuevas aserciones.
- GREEN: mismo comando, `npm test`, `npm run build`.
- Commit boundary: `feat: enable local questionnaire CRUD`.

## Revisión
- Revisión de seguridad API (loopback, origen, método, límite, conflictos, paths), validación de referencias, flujo del editor y revisión de rama. Registrar en `.superpowers/sdd/2026-10-10-local-question-cms/progress.md`.
