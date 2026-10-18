# Implementation Plan: Resumen de percepción vs resultado al final de cada área

> Plan governing spec: `docs/superpowers/specs/2026-10-18-per-area-perception-summary.md`
>
> Estado: activo. Cambio de UI; no toca datos, catálogos ni cálculo de puntuaciones.

## Principios de ejecución

- TDD estricto: pruebas de renderizado que fallen (RED) antes de editar `src/App.jsx`, y `npm test` +
  `npm run build` al cerrar cada tarea.
- Un único componente de resumen (`AreaSummaryBlock`) reutilizado en los dos sitios; nada de duplicar markup.
- No cambiar `scoring.js` ni los JSON de datos.

## Task 1 — Bloque de resumen compartido y resultado final al terminar las preguntas

- **Archivos:** `src/App.jsx`, `src/index.css`, `tests/rendering.test.js`.
- **Interfaz:** nuevo `export function AreaSummaryBlock({ area, score, perception, detail })` que renderiza la
  tarjeta `Tu percepción` / `Resultado` / `Brecha` con `section-summary__*`, la línea de nivel
  (`section-summary__level--<tone>`) y la lectura de la brecha (`result__gap`). Estados: `Pendiente de completar`
  cuando hay respuestas sin llegar a las 22 puntuables, `Sin responder` cuando no hay ninguna.
  `SectionSummary` pasa a: título → `<AreaDetail result={result} areaName={area.name} />` →
  `<AreaSummaryBlock ... />` → botón `Volver a la rueda`. Se eliminan la tarjeta de puntuaciones y la lista
  simple de dimensiones.
- **RED:** en `tests/rendering.test.js`, `SectionSummary` de cada área debe incluir `Tu percepción`, `Resultado`,
  `Brecha`, el detalle (`Tus dimensiones`, `Primer foco:` en áreas completas) y el valor numérico de la brecha,
  con el bloque **después** del detalle; y no debe contener `NaN`. Debe fallar contra el código actual.
- **GREEN:** añadir `AreaSummaryBlock`, reescribir `SectionSummary`, agregar `.area-summary` en `src/index.css`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `feat: show the area perception summary at the end of its result`.

## Task 2 — Mover el bloque a la cola de cada fila en la sección global

- **Archivos:** `src/App.jsx`, `tests/rendering.test.js`.
- **Interfaz:** `ResultRow` deja de renderizar la cabecera `Percepción N · Resultado M` y la insignia
  `badge--gap`; conserva el nombre con su punto de nivel y el avance `<respondidas>/<total> puntuables` cuando
  el área está incompleta. El detalle pasa a `AreaDetail` + `AreaSummaryBlock` al final.
- **RED:** en `tests/rendering.test.js`, `Results` no debe incluir `Percepción 7 · Resultado`; debe incluir 8
  bloques de resumen y, en cada fila, `Brecha` después de `Primer foco:`; el caso parcial debe seguir mostrando
  `21/22 puntuables` y `Pendiente de completar`. Debe fallar contra el código actual.
- **GREEN:** recortar la cabecera de `ResultRow` y añadir `AreaSummaryBlock` al final del detalle; ajustar el
  texto de ayuda de `Results`.
- **Verificación:** `node --test tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `refactor: move each area summary to the end of its row`.

## Riesgos

- El detalle de las filas se renderiza aunque esté `hidden`; las pruebas deben basarse en el orden del markup
  (`Brecha` después de `Primer foco:`), no en visibilidad.
- `AreaDetail` se renderiza dos veces por área (sección global y resumen del cuestionario); el test global debe
  seguir contando 8 `Tus dimensiones` y 8 `Primer foco:`.
- Al quitar la insignia, `.badge--gap` queda sin uso; se conserva el CSS para no ampliar el alcance visual.
