# Flujo de cuestionario por secciones

## Alcance

Cuando el usuario selecciona una sección en la rueda, el cuestionario sigue este orden:

1. **Introducción de la sección**: explica de qué trata el área, qué preguntas se van a contestar y cómo se responden.
2. **Autoevaluación de la sección**: el usuario puntúa su percepción del área de 0 a 10.
3. **Preguntas de la sección**: se muestran las 28 preguntas del área (22 puntuables + 2 prioridades + 4 contexto).
4. **Resumen de la sección**: al completar todas las preguntas, se muestra el resultado de percepción vs resultado de esa área.

## Comportamiento

- El usuario puede navegar entre secciones desde la rueda en cualquier momento.
- Cada sección mantiene su propio estado de respuestas y autoevaluación.
- El resumen de una sección solo aparece cuando todas sus preguntas están respondidas.
- El resumen global (todas las áreas) sigue disponible en la sección "Percepción vs resultado".

## Aceptación

- Al hacer clic en una etiqueta de la rueda, se muestra la introducción de esa sección.
- La introducción incluye: nombre del área, descripción, número de preguntas, tipo de escala y botón para comenzar.
- La autoevaluación se muestra antes de las preguntas y permite puntuar de 0 a 10.
- Las preguntas se muestran una a una con navegación anterior/siguiente.
- Al completar la última pregunta, se muestra el resumen de la sección con la comparación percepción vs resultado.
- El resumen incluye: puntuación del área, percepción, brecha, nivel y dimensiones.
