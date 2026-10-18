# Implementation Plan: Flujo de cuestionario por secciones

> Plan governing spec: `docs/superpowers/specs/2026-10-12-section-quiz-flow.md`

## Task 1 — Vista de introducción de sección

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** nuevo componente `SectionIntro` que muestra información del área y un botón para comenzar.
- **RED:** prueba de renderizado que confirme que `SectionIntro` muestra el nombre del área, descripción y botón de inicio.
- **GREEN:** implementar `SectionIntro` con los datos del área.
- **Verificación:** `node --test tests/rendering.test.js`, `npm run build`.
- **Commit boundary:** `feat: add section introduction view`.

## Task 2 — Autoevaluación integrada en el flujo de sección

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** la autoevaluación de la sección se muestra antes de las preguntas, usando el valor existente `selfEval[areaIndex]`.
- **RED:** prueba de renderizado que confirme que la autoevaluación aparece en el flujo de sección.
- **GREEN:** integrar la autoevaluación en el flujo de sección.
- **Verificación:** `node --test tests/rendering.test.js`, `npm run build`.
- **Commit boundary:** `feat: integrate self-evaluation in section flow`.

## Task 3 — Navegación de preguntas por sección

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** el componente `Quiz` funciona con preguntas de una sección específica (28 preguntas).
- **RED:** prueba de renderizado que confirme que las preguntas de una sección se muestran correctamente.
- **GREEN:** adaptar `Quiz` para trabajar con preguntas de una sección.
- **Verificación:** `node --test tests/rendering.test.js`, `npm run build`.
- **Commit boundary:** `feat: navigate questions by section`.

## Task 4 — Resumen de sección al completar

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** nuevo componente `SectionSummary` que muestra el resultado de la sección al completar las preguntas.
- **RED:** prueba de renderizado que confirme que el resumen aparece al completar las preguntas.
- **GREEN:** implementar `SectionSummary` con la comparación percepción vs resultado.
- **Verificación:** `node --test tests/rendering.test.js`, `npm run build`.
- **Commit boundary:** `feat: add section summary on completion`.

## Task 5 — Integración del flujo completo

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** conectar todas las vistas en el flujo: introducción → autoevaluación → preguntas → resumen.
- **RED:** prueba de renderizado que confirme el flujo completo.
- **GREEN:** integrar todas las vistas en el flujo.
- **Verificación:** `node --test tests/rendering.test.js`, `npm run build`.
- **Commit boundary:** `feat: integrate complete section quiz flow`.

## Revisión

Confirmar que el flujo completo funciona: selección en rueda → introducción → autoevaluación → preguntas → resumen. Verificar que el resumen global sigue disponible y que no hay regresiones en la navegación existente.
