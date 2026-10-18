# Quitar la autoevaluación inicial de la pantalla principal

**Fecha:** 2026-10-18
**Estado:** activo
**Specs relacionadas:** `2026-10-12-section-quiz-flow.md`, `2026-10-17-single-priority-question.md`

## Objetivo

La pantalla principal mostraba una sección «Autoevaluación rápida» para puntuar la percepción de las 8 áreas antes de empezar. Desde `2026-10-12-section-quiz-flow`, cada área recoge su propia percepción al iniciar su sección del cuestionario, por lo que la sección global queda duplicada. Se elimina de la pantalla principal.

## Decisión

- Quitar la sección «Autoevaluación rápida» (id `self`) del layout principal.
- La percepción se sigue recogiendo por área en `SectionSelfEval`, dentro del flujo de cada sección (intro → autoevaluación → preguntas → resumen).
- La sección del cuestionario pasa a ser la abierta por defecto.

## Alcance

- `src/App.jsx`: se elimina el componente `SelfEvaluation` y la sección `self`; `openSection` por defecto pasa a `quiz`; `reset()` y `handleBackToWheel()` abren `quiz`; se retira `selfAvg`.
- `tests/rendering.test.js`: se añade una prueba de que la pantalla inicial no contiene «Autoevaluación rápida» ni «Ir al cuestionario», que la sección «Cuestionario» permanece y que `SectionSelfEval` sigue disponible.
- `README.md`: se aclara que la percepción se recoge al iniciar la sección de cada área.

## Invariantes

- El estado `selfEval` sigue existiendo y alimenta la rueda, la comparación y la brecha.
- El flujo por sección (intro, autoevaluación, preguntas, resumen) no cambia.
- No cambian datos, escalas, cálculo ni resultados.

## Casos de aceptación

1. La pantalla principal no renderiza «Autoevaluación rápida» ni el botón «Ir al cuestionario».
2. `SectionSelfEval` sigue mostrando «Tu percepción de {área}» al iniciar una sección.
3. `npm test` y `npm run build` pasan.

## Fuera de alcance

- Rediseñar la rueda o la navegación por teclado de las etiquetas de área.
- Cambiar el texto o el rango de la autoevaluación por área.
