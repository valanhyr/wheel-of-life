# Revisión y evolución del cuestionario

**Fecha:** 2026-10-04
**Estado:** propuesta para validar

## Objetivo

Revisar las 224 preguntas del cuestionario de la Rueda de la Vida para mejorar su claridad, pertinencia, accesibilidad y utilidad, preservando la trazabilidad de la puntuación. La revisión debe distinguir entre cambios editoriales inocuos y cambios que afectan a las dimensiones, factores, escalas o resultados.

## Alcance actual

- Ocho áreas de 28 preguntas: 22 puntuables, 2 de prioridades y 4 de contexto.
- Cuatro dimensiones por área, ponderadas al 25 %.
- Preguntas declaradas en `src/data/questions.json`; reglas, catálogos y pruebas dependen de sus IDs, dimensiones, polaridades, escalas y factores.
- La aplicación exige responder las 224 preguntas para completar el recorrido actual.

## Hallazgos iniciales

1. La estructura de datos y cálculo está bien cubierta por pruebas, pero no existe una rúbrica para revisar calidad editorial, inclusividad, carga de respuesta, temporalidad o sensibilidad de las preguntas.
2. El recorrido contiene una carga potencialmente alta (224 respuestas obligatorias). Las seis preguntas no puntuables por área también son obligatorias para completar el flujo, aunque prioridad y contexto no alteran la nota.
3. Se alternan escalas de frecuencia de cinco opciones y valoraciones 1–10. Conviene validar que el formato elegido sea comprensible y adecuado para cada enunciado.
4. Hay 33 preguntas con polaridad negativa. La interfaz identifica cada una como «Pregunta inversa», lo que merece una decisión de experiencia y de metodología antes de cambiarlo.
5. Las señales transversales reutilizan preguntas de las dimensiones. Al cambiar una pregunta, sus factores y textos de interpretación también pueden cambiar de significado.

## Requisitos de la revisión

1. Cada pregunta debe tener una decisión registrada: conservar, reescribir, sustituir, eliminar, convertir en opcional o investigar.
2. Cada decisión debe indicar su tipo de impacto:
   - **Editorial:** texto, lenguaje inclusivo, lectura fácil o ayuda; no cambia la semántica medida.
   - **De medición:** cambia el constructo, polaridad, escala, dimensión, factor, obligatoriedad o interpretación.
3. Antes de aplicar cambios de medición se debe aprobar una matriz de impacto que detalle los IDs afectados, migraciones y recalibración requerida.
4. Debe mantenerse la regla de no publicar una nota de área hasta completar sus 22 evidencias puntuables, salvo que se apruebe explícitamente un rediseño metodológico.
5. El resultado no debe presentarse como diagnóstico clínico, financiero o profesional.

## Criterios de aceptación para una primera entrega

- Existe un inventario revisable de las 224 preguntas con su propósito, escala, polaridad, factores, temporalidad y decisión editorial.
- Existe un informe de hallazgos priorizados y una propuesta de recorrido con estimación de respuestas, sin modificar aún la puntuación.
- Las decisiones de medición aprobadas tienen una matriz de impacto y casos de prueba definidos antes de editar los datos de producción.
- Todo cambio implementado conserva las invariantes de IDs, escalas, reglas y resultados, o incluye una migración y pruebas que sustituyan explícitamente esas invariantes.

## Fuera de alcance inicial

- Validación psicométrica formal con muestra estadística.
- Diagnóstico o recomendaciones profesionales personalizadas.
- Cambiar umbrales, catálogos de resultados o pesos sin una decisión metodológica independiente.
