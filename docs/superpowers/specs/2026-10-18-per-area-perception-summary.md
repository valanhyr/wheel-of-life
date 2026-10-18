# Resumen de percepción vs resultado al final de cada área

## Alcance

El bloque **Percepción / Resultado / Brecha** deja de vivir arriba en la fila del área y pasa al final del
resultado de cada área. El resumen completo de un área (el mismo que ofrece la sección global) aparece al
terminar sus preguntas, en el mismo sitio donde se acaba el cuestionario, y no como tarjeta separada.

Queda fuera de alcance:

- El cálculo de puntuaciones (`src/data/scoring.js`): no cambia ninguna fórmula ni umbral.
- Los catálogos, reglas y preguntas.
- El callout de prioridad y el bloque de reflexión (animales/cobertizo): se mantienen en la sección global.

## Decisión de producto

Confirmado con el usuario:

1. Se mantiene la sección global **"Percepción vs resultado"** con la lista de áreas.
2. El bloque **Percepción / Resultado / Brecha** (tarjeta de tres valores + nivel) deja de mostrarse en la
   cabecera de cada fila y se muestra **al final del detalle de cada área**.
3. Al terminar las preguntas de un área, el resumen del cuestionario muestra **el resultado completo de esa
   área** (mismo contenido que su entrada en la sección global) y **termina con ese mismo bloque**.
4. Se elimina la tarjeta de puntuaciones duplicada (y la lista simple de dimensiones) del resumen del
   cuestionario; el detalle reutilizado ya incluye las dimensiones.

## Comportamiento

### Resumen al terminar las preguntas (`SectionSummary`)

Orden del contenido:

1. Título `Resultado de <área>`.
2. Detalle del área (`AreaDetail`): dimensiones, señales transversales, contexto/prioridades y primer foco.
3. Bloque de resumen (`AreaSummaryBlock`): Tu percepción, Resultado, Brecha, nivel del resultado y la lectura
   de la brecha.
4. Botón `Volver a la rueda`.

### Fila de área en la sección global (`Results` / `ResultRow`)

- La cabecera muestra el nombre del área con su punto de nivel y, si el área está incompleta, el avance
  `<respondidas>/<total> puntuables`. Ya no muestra `Percepción N · Resultado M` ni la insignia de brecha.
- El detalle (`AreaDetail`) termina con el mismo bloque de resumen.

### Estados incompletos

- Área con alguna respuesta pero sin las 22 puntuables: `Resultado` = `Pendiente`, `Brecha` = `—` y la línea
  de estado dice `Pendiente de completar`.
- Área sin respuestas: `Brecha` = `—` y la línea de estado dice `Sin responder`.

## Aceptación

- `SectionSummary` incluye `Tu percepción`, `Resultado` y `Brecha`, e incluye el detalle del área
  (`Tus dimensiones` y, si está completa, `Primer foco:`), con el bloque de resumen **después** del detalle.
- `SectionSummary` para un área completa muestra el valor numérico de la brecha (`+N` / `-N` / `0`) y nunca
  `NaN`.
- En `Results`, cada una de las 8 filas termina con el bloque de resumen (la `Brecha` aparece después de
  `Primer foco:` dentro de la fila) y el texto `Percepción <n> · Resultado` ya no aparece en ninguna
  cabecera.
- En `Results`, un área con 21/22 respuestas puntuables sigue mostrando `21/22 puntuables` en la cabecera y
  `Pendiente de completar` en el bloque de resumen.
- `npm test` y `npm run build` pasan.

## Archivos

- `src/App.jsx` — nuevo componente compartido `AreaSummaryBlock`, `SectionSummary` y `ResultRow`.
- `src/index.css` — contenedor `.area-summary` con separador superior.
- `tests/rendering.test.js` — pruebas de orden y de ausencia del bloque en la cabecera.
