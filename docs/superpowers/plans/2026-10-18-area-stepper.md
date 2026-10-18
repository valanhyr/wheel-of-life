# Implementation Plan: Stepper de área

> Plan governing spec: `docs/superpowers/specs/2026-10-18-area-stepper.md`
>
> Estado: activo. Añade navegación por pasos dentro de un área; no toca cálculo ni datos.

## Principios de ejecución

- TDD: pruebas de renderizado primero (RED), después el componente.
- El stepper no duplica contenido: solo cambia `sectionFlow`.
- Mantener intactos `SectionIntro`, `SectionSelfEval`, `Quiz`, `SectionSummary` y `AreaSummaryBlock`.

## Task 1 — Componente y estilos del stepper

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** `export function SectionStepper({ area, step, complete, onStep })`.
  - `step` ∈ `initial` | `quiz` | `result`; `onStep(stepId)`.
  - Lista ordenada `stepper__list` con tres `li`/`button`; el activo lleva `aria-current="step"`.
  - `Resultado` lleva `disabled` cuando `complete === false`.
  - Etiqueta del área visible (`stepper__area`) y `aria-label` en cada botón (`Ir a <paso>`).
- **RED:** `tests/rendering.test.js` renderiza `SectionStepper` para un área y exige las tres etiquetas, un
  único `aria-current="step"` en el paso recibido, y `Resultado` deshabilitado con `complete={false}` y
  habilitado con `complete={true}`. Debe fallar por componente inexistente.
- **GREEN:** implementar el componente y el CSS `.stepper*`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: add an area stepper`.

## Task 2 — Integración en el flujo del área

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** en `App`, cuando `activeIndex != null`, el cuerpo de la `Section` del cuestionario empieza con
  `<SectionStepper … />`. `step` se deriva de `sectionFlow` (`intro`/`selfeval` → `initial`, `questions` →
  `quiz`, `summary` → `result`). `onStep` implementa:
  - `initial` → `setSectionFlow("intro")`.
  - `quiz` → `qIndex` a la primera pregunta del área sin responder (o 0) y `setSectionFlow("questions")`.
  - `result` → `setSectionFlow("summary")`.
- **RED:** `tests/rendering.test.js` renderiza `App` en su estado inicial y exige que **no** haya stepper (no hay
  área activa). Debe fallar si el stepper se renderiza siempre.
- **GREEN:** montar el stepper y añadir `handleStep`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: jump between area steps without redoing the questionnaire`.

## Riesgos

- `Resultado` deshabilitado mientras el área está incompleta evita resúmenes a medias, pero un área al 21/22 no
  puede mostrar su resumen; el botón indica el estado con `disabled`.
- Saltar a `Cuestionario` reinicia `qIndex` en la primera pregunta sin responder; quien quiera revisar desde el
  principio de un área completa empieza en la pregunta 1 (mismo comportamiento).
- El stepper convive con el encabezado de la `Section` ("Cuestionario"), que sigue mostrando el progreso global.
