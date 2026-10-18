# Quitar la sección "Percepción vs resultado" y añadir un ranking de prioridad bajo la rueda

## Alcance

La sección acordeón **"Percepción vs resultado"** (`Section` con `id="results"`) desaparece: su contenido
duplicaba el resumen que ahora cierra cada área. En su lugar, debajo de la rueda se muestra un **ranking
sugerido de prioridad** entre las áreas ya puntuadas.

Esta spec supersede la decisión R1 de `2026-10-18-per-area-perception-summary.md` (mantener la sección global).

Queda fuera de alcance:

- El cálculo de puntuaciones y el orden de prioridad (`priorityOrder` en `src/data/scoring.js`): no cambia.
- Los datos (`actions.json`, catálogos, reglas, preguntas): no se tocan.
- El flujo por área (introducción → percepción → preguntas → resumen) y el resumen de cierre de cada área.

## Comportamiento

### Sección eliminada

- Se elimina la `Section` `results` de `App`, junto con `Results`, `ResultRow` y `Reflection`.
- Desaparecen de la interfaz el texto `Percepción vs resultado` como sección, el aviso de prioridad y el
  bloque «Para profundizar en cualquier área» (animales y cobertizo).
- La ayuda que explicaba la brecha en esa sección también desaparece; cada área explica su brecha en su
  propio bloque final (`Coincide con tu percepción`, `Algo peor de lo que percibías`, …).
- Al terminar el cuestionario completo (recorrido sin área), la vista vuelve a la rueda.

### Ranking sugerido bajo la rueda

- Nuevo componente `PriorityRanking({ selfEval, scores })` colocado dentro de la columna de la rueda,
  inmediatamente después del SVG.
- Título: `Ranking sugerido`.
- Lista ordenada de las áreas con nota publicada, de **peor a mejor resultado** (mismo criterio que
  `priorityOrder`: nota ascendente y, en empate, brecha más en contra primero).
- Cada fila muestra: posición, nombre del área, punto de nivel, nota (`x.x/10`) y etiqueta de nivel.
- Si no hay ninguna área con nota, muestra `Completa un área para ver su prioridad sugerida.`
- En pantallas < 1024 px con el cuestionario abierto (rueda compacta), el ranking se oculta para no ocupar
  el encabezado pegajoso.

## Aceptación

- `App` renderizado en su estado inicial no incluye `Percepción vs resultado` ni
  `Para profundizar en cualquier área`, y sí incluye `Ranking sugerido`.
- `PriorityRanking` con las 8 áreas completas renderiza 8 filas, con el área de peor nota antes que la de
  mejor nota.
- `PriorityRanking` sin notas renderiza el texto de estado vacío y ninguna fila.
- `AreaDetail`, `AreaSummaryBlock` y `SectionSummary` siguen funcionando como hasta ahora (dimensiones,
  señales, foco, prioridad, percepcion/resultado/brecha).
- `npm test` y `npm run build` pasan.

## Archivos

- `src/App.jsx` — elimina `Results`, `ResultRow`, `Reflection` y la `Section` `results`; añade `PriorityRanking`.
- `src/index.css` — estilos `.ranking*` y ocultación del ranking en la rueda compacta.
- `tests/rendering.test.js` — pruebas del ranking, de la ausencia de la sección y de los componentes que
  siguen vivos.
