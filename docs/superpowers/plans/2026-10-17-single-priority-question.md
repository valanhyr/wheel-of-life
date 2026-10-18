# Implementation Plan: Una sola pregunta de prioridad por área

> Plan governing spec: `docs/superpowers/specs/2026-10-17-single-priority-question.md`
>
> Estado: activo. Cambio de medición acotado: elimina la pregunta de deseo de cambio y unifica la etiqueta de prioridad.

## Principios de ejecución

- No cambiar IDs de preguntas salvo el retiro explícito aprobado en la matriz de impacto.
- Mantener intactas las 22 preguntas puntuables, dimensiones, pesos, escalas, factores y catálogos.
- TDD por tarea: escribir la expectativa que falle (RED), aplicar el mínimo (GREEN), ejecutar `npm test` y `npm run build`.

## Task 0 — Corregir la brecha `NaN` del resumen de sección

**Estado:** ✅ completado (previo a este plan).

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Cambio:** `SectionSummary` usaba el objeto de `gapStatus()` como número; ahora usa `gap.gap`.
- **Verificación:** regresión en `tests/rendering.test.js` que recorre las 8 áreas.

## Task 1 — Retirar la pregunta de deseo de cambio (medición)

**Objetivo:** dejar una sola pregunta de prioridad por área.

- **Archivos:** `src/data/questions.json`, `src/data/scoring.js`, `src/data/editor-validation.js`, `tests/*`, `tests/fixtures/*-demo.json`, `README.md`.
- **Interfaz/datos:** se eliminan `SAL_CAM_01`, `EMO_CAM_01`, `REL_CAM_01`, `FAM_CAM_01`, `TRA_CAM_01`, `FIN_DES_01`, `CRE_CAM_01`, `OCI_CAM_01`. `structuredResult` deja de aceptar `desireId` y de devolver `desire`; conserva `importance`.
- **RED:** actualizar los tests de conteo y estructura (216 total, 27 por área, 1 prioridad, 8 prioridades) y ejecutarlos; deben fallar contra el contenido actual.
- **GREEN:** eliminar las 8 preguntas, actualizar `notes`, retirar `desireId`/`desire` y limpiar `fixedIds`.
- **Verificación:** `node --test tests/questionnaire-content.test.js tests/priority-scale.test.js tests/areas-scoring.test.js tests/work-scoring.test.js tests/scoring.test.js tests/question-editor-api.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `refactor: keep a single priority question per area`.

## Task 2 — Unificar la etiqueta de prioridad y los textos de intro (UI)

**Objetivo:** mostrar una sola lectura de prioridad y reflejar el nuevo conteo.

- **Archivos:** `src/App.jsx`, `src/index.css` (solo si hace falta), `tests/rendering.test.js`.
- **Interfaz:** `AreaDetail` muestra `Prioridad de esta área: X/10` y deja de mostrar «Deseo de cambio». `SectionIntro` muestra «27 preguntas», «1 prioridad» y ajusta la descripción de la pregunta de prioridad.
- **RED:** test de renderizado que exija la etiqueta unificada y la ausencia de «Deseo de cambio».
- **GREEN:** aplicar el cambio mínimo en `App.jsx`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: unify the priority label in the results detail`.

## Orden y puntos de decisión

1. Task 1 (datos y cálculo) antes de Task 2 (UI), para que los tests de contenido guíen el conteo.
2. No mezclar cambios editoriales de otros specs en estos commits.
3. Cerrar con `npm test` y `npm run build`.

## Riesgos principales

- Retirar la pregunta de deseo reduce la personalización del detalle; la etiqueta unificada conserva la información de importancia.
- El editor de preguntas validaba las preguntas de deseo como referencias fijas; si no se limpia `fixedIds`, `validateEditorSnapshot` fallaría en `question-editor-api.test.js`.
- Los fixtures con respuestas de deseo quedarían obsoletos; se retiran para mantenerlos veraces.
