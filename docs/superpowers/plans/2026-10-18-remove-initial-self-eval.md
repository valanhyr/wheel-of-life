# Implementation Plan: Quitar la autoevaluación inicial

> Plan governing spec: `docs/superpowers/specs/2026-10-18-remove-initial-self-eval.md`
>
> Estado: activo. Cambio de experiencia de cuestionario; no toca datos ni cálculo.

## Principios de ejecución

- Mantener `selfEval` y el flujo por sección intactos.
- TDD: prueba de renderizado que falle (RED) antes de editar `App.jsx`, y `npm test` + `npm run build` al cerrar.

## Task 1 — Retirar la sección de autoevaluación global (UI)

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`, `README.md`.
- **Interfaz:** se elimina el componente `SelfEvaluation` y la `Section` con `id="self"`. `openSection` inicial, `reset()` y `handleBackToWheel()` usan `quiz`. Se elimina `selfAvg`.
- **RED:** `tests/rendering.test.js` renderiza `App` y exige la ausencia de «Autoevaluación rápida»/«Ir al cuestionario`, la presencia de «Cuestionario» y que `SectionSelfEval` siga mostrando la percepción por área; debe fallar contra el código actual.
- **GREEN:** eliminar la sección y el componente, ajustar el estado por defecto y limpiar `selfAvg`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `refactor: collect perception only inside each section`.

## Riesgos

- Dejar `openSection` apuntando a `self` tras eliminar la sección dejaría el layout sin sección abierta; se cambia a `quiz`.
- El CSS `.aspect*` queda sin uso; se conserva para no ampliar el alcance visual.
