# Una sola pregunta de prioridad por área

**Fecha:** 2026-10-17
**Estado:** activo
**Specs relacionadas:** `2026-10-04-questionnaire-review.md`, `2026-10-12-whole-number-priority-scale.md`, `2026-10-10-guided-question-editor.md`

## Objetivo

Reducir la repetición de las preguntas de prioridad: cada área del cuestionario tiene hoy dos preguntas no puntuables muy parecidas (importancia de mejorar y deseo de cambio). Se conserva una sola pregunta, la de **importancia** (`*_IMP_01`), y se elimina la de **deseo de cambio**, unificando su lectura en una única etiqueta de resultado.

## Decisión aprobada

- **Conservar solo importancia:** se mantiene `*_IMP_01` tal cual y se elimina la pregunta de deseo de cambio (`*_CAM_01` / `FIN_DES_01`).
- **Una sola etiqueta:** el detalle de resultado muestra un único valor `Prioridad de esta área: X/10` en lugar de «Importancia de mejorar» y «Deseo de cambio».

## Matriz de impacto (medición)

| Área | ID eliminado | Pregunta eliminada | Pregunta conservada |
|---|---|---|---|
| salud | `SAL_CAM_01` | deseo de cambio | `SAL_IMP_01` |
| emocional | `EMO_CAM_01` | deseo de cambio | `EMO_IMP_01` |
| relaciones | `REL_CAM_01` | deseo de cambio | `REL_IMP_01` |
| familia | `FAM_CAM_01` | deseo de cambio | `FAM_IMP_01` |
| trabajo | `TRA_CAM_01` | deseo de cambio | `TRA_IMP_01` |
| finanzas | `FIN_DES_01` | deseo de cambio | `FIN_IMP_01` |
| crecimiento | `CRE_CAM_01` | deseo de cambio | `CRE_IMP_01` |
| ocio | `OCI_CAM_01` | deseo de cambio | `OCI_IMP_01` |

- Total: **224 → 216 preguntas** (8 eliminadas).
- Por área: **28 → 27** preguntas (22 puntuables + **1 prioridad** + 4 contexto).

### Invariantes que NO cambian

- Preguntas puntuables (22 por área), dimensiones, pesos (25 %), `question_ids` de reglas y factores transversales.
- Escalas, polaridad, umbrales, catálogos de resultados, patrones, foco y cálculo de brecha.
- Regla de completitud: la nota de área sigue requiriendo las 22 evidencias puntuables.

### Sí cambia

- `src/data/questions.json`: se eliminan las 8 preguntas de deseo; `notes` pasa a «27 preguntas por área (22 puntuables con factores transversales, 1 de prioridad y 4 de contexto)».
- `src/data/scoring.js`: se elimina el parámetro `desireId` y el campo `desire` del resultado; se conserva `importance`.
- `src/data/editor-validation.js`: `fixedIds` deja de exigir las preguntas de deseo.
- `src/App.jsx`: etiqueta unificada y textos de intro (27 / 1 prioridad).
- Tests y fixtures de demostración: se actualizan los conteos y se retiran las respuestas de deseo.
- `README.md`: conteos actualizados.

## Casos de prueba (aceptación)

1. El cuestionario tiene 216 preguntas, todas con `uid` único.
2. Cada área tiene 27 preguntas: 22 puntuables, 1 de prioridad (`priority_1_10`) y 4 de contexto.
3. Quedan 8 preguntas de prioridad en total (una por área).
4. `detailedResult` expone `importance` y ya no expone `desire`.
5. El detalle de resultado muestra `Prioridad de esta área: X/10` y no muestra «Deseo de cambio».
6. La nota de cada área de demostración (`tests/fixtures/*-demo.json`) no cambia.
7. `npm test` y `npm run build` pasan.

## Fuera de alcance

- Reescribir el enunciado de la pregunta de importancia (se conserva el texto actual).
- Cambiar escalas, umbrales, dimensiones, factores o catálogos.
- Migración de respuestas guardadas de usuarios (no existe almacenamiento persistente de respuestas).
