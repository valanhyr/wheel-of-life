# Portada con instrucciones junto a la rueda

## Alcance

La pantalla inicial deja de mostrar el cuestionario completo y pasa a mostrar **instrucciones de uso** junto a
la rueda. Las instrucciones indican que hay que **seleccionar un área en la rueda** para abrir su cuestionario.

No cambia el flujo por área, el stepper, el ranking, el cálculo de puntuaciones ni los datos.

## Comportamiento

### Portada (sin área activa)

- La columna derecha muestra el bloque `Cómo usar la rueda` en lugar del cuestionario.
- El encabezado de la sección pasa a `Cómo usar la rueda` / `Selecciona un área en la rueda` y oculta la barra
  de progreso.
- La rueda se muestra a tamaño completo (ya no se compacta en móvil al cargar).
- El ranking sugerido sigue debajo de la rueda.
- No se renderiza ninguna pregunta ni el stepper.

### Texto de las instrucciones

Título: **Cómo usar la rueda**

Entradilla: «La rueda resume ocho áreas de tu vida. Cada área tiene su propio cuestionario y puedes hacerlas en
el orden que prefieras.»

1. **Elige un área en la rueda.** Pulsa su nombre —Salud, Emocional, Relaciones, Familia, Trabajo, Finanzas,
   Crecimiento u Ocio— para abrir su cuestionario.
2. **Puntúa tu percepción (0–10).** Antes de las preguntas, marca cómo crees que está esa área hoy; después se
   compara con el resultado.
3. **Responde sus 28 preguntas.** 22 puntuables, 1 de prioridad y 4 de contexto. Las de contexto no puntúan:
   matizan la lectura.
4. **Lee el resultado del área.** Verás percepción frente a resultado, la brecha, tus cuatro dimensiones, las
   señales transversales y el primer foco. Puedes volver a cualquier paso cuando quieras.

Nota final: «La nota de un área aparece en la rueda cuando completas sus 22 preguntas puntuables; hasta
entonces, los parciales son orientativos. Puedes dejar un área a medias y volver más tarde: el ranking bajo la
rueda sugiere por dónde empezar.»

### Área activa

- Sin cambios: encabezado `Cuestionario`, barra de progreso, stepper y el paso correspondiente.
- La rueda se compacta en móvil mientras se trabaja en un área (comportamiento actual).

## Aceptación

- `App` en su estado inicial incluye `Cómo usar la rueda`, `Elige un área en la rueda` y las cuatro entradas
  numeradas; no incluye `Anterior`, `Siguiente` ni campos `scale__input`.
- Sigue incluyendo `Ranking sugerido` y no incluye `Evaluación inicial` (sin área activa no hay stepper).
- `WheelInstructions` renderiza el título, la entradilla, los cuatro pasos y la nota.
- `npm test` y `npm run build` pasan.

## Archivos

- `src/App.jsx` — nuevo `WheelInstructions`, portada sin cuestionario, título/summary dinámicos y `is-focus`
  ligado al área activa.
- `src/index.css` — estilos `.instructions*`.
- `tests/rendering.test.js` — pruebas de la portada y de `WheelInstructions`.
