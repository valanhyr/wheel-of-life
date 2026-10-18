# Implementation Plan: Quitar "Percepción vs resultado" y añadir ranking bajo la rueda

> Plan governing spec: `docs/superpowers/specs/2026-10-18-remove-results-section-ranking.md`
>
> Estado: activo. Elimina UI y añade un resumen de prioridad; no toca cálculo ni datos.

## Principios de ejecución

- TDD: primero las pruebas de renderizado (RED), después el código.
- No tocar `src/data/scoring.js` ni los JSON: `priorityOrder` ya ofrece el orden necesario.
- Mantener `AreaDetail`, `AreaSummaryBlock` y `SectionSummary` intactos.

## Task 1 — Ranking sugerido bajo la rueda

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** `export function PriorityRanking({ selfEval, scores })`.
  - `const ranked = priorityOrder(scores, selfEval)`; sin filas cuando `ranked.length === 0`, con el texto
    `Completa un área para ver su prioridad sugerida.`
  - Cada fila: `ranking__position` (índice + 1), `ranking__name`, `dot dot--<tone>` con `title`/`aria-label`
    del nivel, `ranking__score` (`round1(score)/10`) y `ranking__level` (etiqueta del nivel).
  - Estilos en `src/index.css`: `.ranking`, `.ranking__title`, `.ranking__list`, `.ranking__item`,
    `.ranking__position`, `.ranking__name`, `.ranking__score`, `.ranking__level`; `display: none` para
    `.layout.is-focus .ranking` dentro del media query de < 1024 px.
- **RED:** `tests/rendering.test.js` renderiza `PriorityRanking` con las 8 áreas completas y exige 8 filas y
  que el área de peor nota aparezca antes que la de mejor nota (usando `priorityOrder`); con notas `null`
  exige el texto vacío y cero filas. Debe fallar por componente inexistente.
- **GREEN:** implementar `PriorityRanking`, montarlo en `App` bajo `<Wheel />` y añadir el CSS.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: rank area priorities under the wheel`.

## Task 2 — Eliminar la sección "Percepción vs resultado"

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** eliminar `Results`, `ResultRow`, `Reflection` y la `Section` con `id="results"`; quitar del
  `import` de `scoring` lo que solo usaban (`interpretationFor`, `priorityFor`, `guidanceFor`, `gapPrompts`,
  `animals`, `shed`) y la constante `alerts`. El `Quiz` sin área, al terminar, llama a `handleBackToWheel`.
- **RED:** `tests/rendering.test.js` renderiza `App` y exige que no aparezcan `Percepción vs resultado` ni
  `Para profundizar en cualquier área`, y que sí aparezca `Ranking sugerido`. Las pruebas que dependían de
  `Results`/`ResultRow` se reescriben sobre `AreaDetail`, `AreaSummaryBlock` y `SectionSummary`.
- **GREEN:** borrar los componentes y la sección, limpiar imports y estado.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `refactor: drop the standalone results section`.

## Riesgos

- Al desaparecer la lista global, para volver a ver el resumen de un área ya completada hay que recorrer su
  cuestionario otra vez. Se documenta como limitación conocida; un atajo queda fuera de alcance.
- Los estilos de `.result*` y `.badge--gap` que solo usaba `ResultRow` quedan sin uso; se conservan para no
  ampliar el alcance visual (mismo criterio que en el cambio anterior).
- `animals` y `shed` seguirán exportados en `scoring.js` aunque ninguna vista los use; no se tocan los datos.
