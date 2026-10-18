# Implementation Plan: Revisión y evolución del cuestionario

> Plan governing spec: `docs/superpowers/specs/2026-10-04-questionnaire-review.md`
>
> Estado: propuesta. Las tareas 1–2 producen las decisiones necesarias; las tareas 3–6 solo se ejecutan para los cambios que se aprueben.

## Principios de ejecución

- No cambiar IDs de preguntas a menos que exista un mapa de migración aprobado.
- Clasificar cada modificación como editorial o de medición antes de implementarla.
- Mantener separados los cambios de contenido, cálculo y experiencia de cuestionario para que se puedan verificar y revertir de forma independiente.
- Para cada tarea de código: seguir TDD (RED, implementación mínima, GREEN) y ejecutar `npm test` y `npm run build` al cerrar la tarea.

## Task 1 — Construir el inventario y la rúbrica editorial

**Objetivo:** disponer de una fuente de revisión humana, no solo de la estructura técnica.

- **Archivos:** crear `docs/questionnaire/question-inventory.md` y `docs/questionnaire/review-rubric.md`; consultar `src/data/questions.json` y `src/data/response-scales.json`.
- **Interfaz/datos:** una fila por ID con área, dimensión, texto, tipo de respuesta, escala, polaridad, factores, periodo de referencia, sensibilidad, decisión y justificación.
- **Comprobación:** verificar 224 filas, 8 áreas y la clasificación 22/2/4 por área. No requiere prueba automatizada porque es documentación de auditoría.
- **Cierre:** revisión editorial de una muestra de al menos una dimensión completa por área; registrar preguntas ambiguas, duplicadas en significado, largas, normativas o dependientes de circunstancias no controlables.
- **Commit boundary:** `docs: add questionnaire inventory and review rubric`.

## Task 2 — Priorizar hallazgos y aprobar decisiones de producto

**Objetivo:** transformar el inventario en una lista de cambios decididos, no en una edición ad hoc.

- **Archivos:** crear `docs/questionnaire/review-findings.md` y `docs/questionnaire/change-decisions.md`; actualizar la especificación si cambia el alcance.
- **Interfaz/datos:** matriz de decisión con prioridad, beneficio esperado, impacto de medición, alternativas y persona responsable de la aprobación.
- **Comprobación:** cada una de las 224 preguntas tiene decisión; cada cambio de medición identifica ID, dimensión, factores, escala/polaridad y catálogo/regla potencialmente afectados.
- **Decisiones a resolver:**
  1. ¿Se mantiene el recorrido único de 224 respuestas o se divide por área, se permite guardar/continuar o se hace opcional el contexto?
  2. ¿Se unifican formatos de respuesta cuando sea posible o se conserva la escala adecuada a cada ítem?
  3. ¿Se reducen, reescriben o mantienen las preguntas inversas y se muestra o no su inversión de puntuación?
  4. ¿Qué horizonte temporal explícito debe usar cada área y qué excepciones son válidas?
- **Commit boundary:** `docs: record approved questionnaire changes`.

## Task 3 — Añadir contratos automatizados para el contenido aprobado

**Objetivo:** convertir las decisiones de Task 2 en protecciones contra regresiones.

- **Archivos:** actualizar `tests/areas-scoring.test.js`; crear `tests/questionnaire-content.test.js`; usar `src/data/questions.json`, `src/data/response-scales.json` y, si se aprueba, `docs/questionnaire/content-contract.json`.
- **Interfaz/datos:** contrato por pregunta para los atributos que no pueden romperse (ID, área, dimensión, puntuable, escala, polaridad y factores); reglas de temporalidad y opcionalidad que hayan sido aprobadas.
- **RED:** `node --test tests/questionnaire-content.test.js` con una expectativa para cada nueva decisión que falle contra el contenido actual.
- **GREEN:** aplicar el cambio mínimo de datos o de contrato y volver a ejecutar el archivo.
- **Verificación:** `npm test` y `npm run build`.
- **Commit boundary:** `test: define approved questionnaire content contracts`.

## Task 4 — Aplicar cambios editoriales sin alterar la medición

**Objetivo:** mejorar legibilidad e inclusión conservando exactamente la semántica y cálculo aprobados.

- **Archivos:** `src/data/questions.json`; opcionalmente `src/App.jsx` para ayudas de lectura; `tests/questionnaire-content.test.js` y `tests/rendering.test.js`.
- **Interfaz/datos:** conservar ID, `areaId`, `dimension`, `scored`, `responseScale`, `polarity`, `factors` y `factorWeights` de cada pregunta editorialmente modificada.
- **RED:** una aserción de texto/contrato o renderizado que represente el cambio aprobado y falle antes de editar el JSON.
- **GREEN:** actualizar solo los enunciados, etiquetas o ayudas aprobadas; comprobar que las respuestas de los fixtures siguen produciendo el mismo resultado.
- **Verificación:** `node --test tests/questionnaire-content.test.js tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** un commit por área o lote editorial coherente.

## Task 5 — Aplicar cambios de medición y recalibrar resultados

**Objetivo:** realizar con seguridad cualquier cambio de escala, polaridad, dimensión, factores o número de preguntas.

- **Archivos:** `src/data/questions.json`, los `src/data/*-rules.json` y `src/data/*-results.json` afectados, `src/data/response-scales.json`, `src/data/scoring.js`, fixtures y pruebas de puntuación relevantes.
- **Interfaz/datos:** matriz de impacto aprobada; si un ID se retira o cambia de significado, mapa de migración y versión de esquema. Mantener la correspondencia entre `question_ids` de reglas, preguntas puntuables y factores.
- **RED:** añadir primero casos para la nueva escala/polaridad, completitud, media ponderada, foco, factores, patrones y textos de resultado; ejecutar el archivo de pruebas afectado y confirmar el fallo esperado.
- **GREEN:** modificar el mínimo de datos y lógica; actualizar fixtures con las nuevas expectativas, no con valores calculados a mano sin justificación.
- **Verificación:** `node --test tests/scoring.test.js tests/work-scoring.test.js tests/areas-scoring.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** un commit por decisión de medición aprobada; no mezclarla con cambios visuales.

## Task 6 — Mejorar el recorrido de respuesta, si se aprueba

**Objetivo:** reducir fricción sin perder la regla de completitud de la nota.

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`; `src/data/questions.json` solo si se cambia obligatoriedad o el orden.
- **Interfaz/datos:** definir el comportamiento de avance, revisión, progreso por área, preguntas opcionales, guardar/continuar y el aviso de preguntas inversas. Una pregunta opcional de contexto no debe bloquear la nota ni `contextComplete` sin actualizar la especificación.
- **RED:** añadir tests de renderizado para el flujo aprobado (p. ej., progreso por área, salto permitido o estado de contexto pendiente) y confirmar el fallo.
- **GREEN:** implementar el mínimo flujo accesible con etiquetas ARIA y navegación por teclado conservadas.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: improve questionnaire response flow`.

## Orden y puntos de decisión

1. Ejecutar Tasks 1 y 2.
2. Presentar la matriz de decisiones para aprobación.
3. Si solo hay cambios editoriales: Tasks 3 y 4.
4. Si hay cambios de medición: Task 3 y después Task 5, área por área.
5. Ejecutar Task 6 únicamente después de decidir la carga y opcionalidad del cuestionario.

## Riesgos principales

- Acortar preguntas puntuables modifica la evidencia de una dimensión y puede hacer que los resultados previos no sean comparables.
- Un cambio de polaridad o de escala puede invertir una puntuación sin que sea visible en la interfaz.
- Cambiar una pregunta asociada a factores transversales altera tanto la dimensión como las señales provisionales.
- Hacer opcional el contexto requiere decidir si desaparece el aviso actual de personalización incompleta.
