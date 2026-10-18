# Stepper de área: evaluación inicial, cuestionario y resultado

## Alcance

Dentro del área seleccionada se añade un **stepper** con tres pasos —`Evaluación inicial`, `Cuestionario`,
`Resultado`— que permite saltar entre ellos sin repetir el recorrido. Así, un área ya completada puede
mostrar su resultado con un clic en lugar de volver a avanzar por las 28 preguntas.

No cambia el contenido de cada pantalla, el cálculo de puntuaciones ni los datos.

## Comportamiento

### Pasos

| Paso | Pantallas que agrupa |
| --- | --- |
| `Evaluación inicial` | introducción del área y autoevaluación de percepción (0–10) |
| `Cuestionario` | preguntas de la sección, una a una |
| `Resultado` | resumen de cierre del área (`SectionSummary`) |

- El stepper solo aparece cuando hay un área activa (no en la rueda ni en el cuestionario completo).
- El paso actual se marca con `aria-current="step"` y estilo resaltado.
- `Resultado` está deshabilitado mientras el área no tenga nota publicada (22 preguntas puntuables
  respondidas); una vez completa, se habilita.
- Al pulsar `Cuestionario` se abre la primera pregunta **sin responder** del área; si ya están todas
  respondidas, la primera.
- Al pulsar `Evaluación inicial` se vuelve a la introducción del área.
- El botón `Volver a la rueda` del resumen se mantiene.

### Qué no cambia

- La entrada desde la rueda sigue abriendo la introducción del área.
- El flujo lineal (introducción → percepción → preguntas → resumen) sigue funcionando igual sin usar el
  stepper.
- El editor de preguntas y el cuestionario completo quedan fuera del stepper.

## Aceptación

- `SectionStepper` renderiza las etiquetas `Evaluación inicial`, `Cuestionario` y `Resultado`.
- Marca exactamente un paso con `aria-current="step"` y coincide con el paso recibido.
- Con el área incompleta, `Resultado` sale `disabled`; con el área completa, no.
- `App` no renderiza el stepper cuando no hay área activa.
- `npm test` y `npm run build` pasan.

## Archivos

- `src/App.jsx` — `SectionStepper`, estado `sectionFlow` y salto a la primera pregunta sin responder.
- `src/index.css` — estilos `.stepper*`.
- `tests/rendering.test.js` — pruebas del stepper.
