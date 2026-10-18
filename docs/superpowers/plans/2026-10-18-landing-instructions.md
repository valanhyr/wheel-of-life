# Implementation Plan: Portada con instrucciones junto a la rueda

> Plan governing spec: `docs/superpowers/specs/2026-10-18-landing-instructions.md`
>
> Estado: activo. Cambia la pantalla inicial; no toca cálculo ni datos.

## Principios de ejecución

- TDD: pruebas de renderizado primero (RED), después el componente.
- Mantener `Wheel`, `PriorityRanking`, `SectionStepper` y el flujo por área intactos.

## Task 1 — Componente `WheelInstructions`

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** `export function WheelInstructions()` sin props. Renderiza `<article className="instructions">`
  con `<h3>`, entradilla, `<ol>` de cuatro pasos (cada uno con título en negrita y detalle) y nota final.
- **RED:** `tests/rendering.test.js` renderiza `WheelInstructions` y exige el título `Cómo usar la rueda`, la
  frase `Elige un área en la rueda`, `28 preguntas`, `Puntúa tu percepción` y `Lee el resultado del área`.
  Debe fallar por componente inexistente.
- **GREEN:** implementar el componente y el CSS `.instructions*`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: add landing instructions for the wheel`.

## Task 2 — Portada sin cuestionario

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:**
  - `App` con `activeIndex == null` renderiza `<WheelInstructions />`; el `Quiz` completo deja de montarse.
  - `Section` recibe `title={activeIndex == null ? "Cómo usar la rueda" : "Cuestionario"}`,
    `summary={activeIndex == null ? "Selecciona un área en la rueda" : \`${answered} de ${questions.length} respondidas\`}`
    y `meter` solo con área activa.
  - `main` usa `is-focus` solo cuando `activeIndex != null`, para que la rueda no se compacte en la portada.
- **RED:** `tests/rendering.test.js` renderiza `App` y exige `Cómo usar la rueda`, `Elige un área en la rueda`
  y la ausencia de `Anterior`, `Siguiente` y `scale__input`. Debe fallar contra el código actual (hoy muestra el
  cuestionario y el título `Cuestionario`).
- **GREEN:** sustituir la rama del cuestionario completo por las instrucciones y ajustar encabezado y clases.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: show wheel instructions on the landing page`.

## Riesgos

- `openSection` queda con un único valor posible (`quiz`); se conserva para no rehacer el acordeón en este
  cambio. El encabezado no colapsa nada, igual que antes.
- Al quitar el cuestionario completo de la portada, la única vía de respuesta es por área (desde la rueda), que
  es justo el comportamiento pedido.
- `Quiz` mantiene su modo sin `areaIndex` porque las pruebas lo usan para recorrer las 224 preguntas; `App` ya
  no lo monta.
