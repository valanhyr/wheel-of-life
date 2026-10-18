# Revisión y evolución del cuestionario

**Fecha:** 2026-10-04
**Actualizado:** 2026-10-17
**Estado:** activo — enfocado en revisión editorial

## Objetivo

Revisar las 216 preguntas del cuestionario de la Rueda de la Vida para mejorar su claridad, pertinencia, accesibilidad y utilidad, preservando la trazabilidad de la puntuación. La revisión debe distinguir entre cambios editoriales inocuos y cambios que afectan a las dimensiones, factores, escalas o resultados.

## Alcance actual

- Ocho áreas de 27 preguntas: 22 puntuables, 1 de prioridad y 4 de contexto.
- Cuatro dimensiones por área, ponderadas al 25 %.
- Preguntas declaradas en `src/data/questions.json`; reglas, catálogos y pruebas dependen de sus IDs, dimensiones, polaridades, escalas y factores.
- La aplicación exige responder las 216 preguntas para completar el recorrido actual.

## Resoluciones previas (specs posteriores)

| Hallazgo original | Resuelto por | Estado |
|---|---|---|
| Carga alta (216 respuestas obligatorias) | `2026-10-12-section-quiz-flow` | ✅ Recorrido por área con intro/self-eval/summary |
| Escalas mixtas (frecuencia + valoración) | `2026-10-12-uniform-question-options`, `2026-10-12-whole-number-priority-scale` | ✅ Formato unificado y consistente |
| Señales transversales reutilizan preguntas | `2026-10-10-guided-question-editor` | ✅ Análisis de impacto con fixtures |

## Hallazgos pendientes

1. La estructura de datos y cálculo está bien cubierta por pruebas, pero no existe una rúbrica para revisar calidad editorial, inclusividad, carga de respuesta, temporalidad o sensibilidad de las preguntas.
2. Hay 33 preguntas con polaridad negativa. La interfaz identifica cada una como «Pregunta inversa», lo que merece una decisión de experiencia y de metodología antes de cambiarlo.
3. Las seis preguntas no puntuables por área (prioridades + contexto) son obligatorias para completar el flujo. Evaluar si deben ser opcionales o mantener su obligatoriedad.

## Requisitos de la revisión

1. Cada pregunta debe tener una decisión registrada: conservar, reescribir, sustituir, eliminar, convertir en opcional o investigar.
2. Cada decisión debe indicar su tipo de impacto:
   - **Editorial:** texto, lenguaje inclusivo, lectura fácil o ayuda; no cambia la semántica medida.
   - **De medición:** cambia el constructo, polaridad, escala, dimensión, factor, obligatoriedad o interpretación.
3. Antes de aplicar cambios de medición se debe aprobar una matriz de impacto que detalle los IDs afectados, migraciones y recalibración requerida.
4. Debe mantenerse la regla de no publicar una nota de área hasta completar sus 22 evidencias puntuables, salvo que se apruebe explícitamente un rediseño metodológico.
5. El resultado no debe presentarse como diagnóstico clínico, financiero o profesional.

## Criterios de aceptación para una primera entrega

- Existe un inventario revisable de las 216 preguntas con su propósito, escala, polaridad, factores, temporalidad y decisión editorial.
- Existe un informe de hallazgos priorizados y una propuesta de recorrido con estimación de respuestas, sin modificar aún la puntuación.
- Las decisiones de medición aprobadas tienen una matriz de impacto y casos de prueba definidos antes de editar los datos de producción.
- Todo cambio implementado conserva las invariantes de IDs, escalas, reglas y resultados, o incluye una migración y pruebas que sustituyan explícitamente esas invariantes.

## Fuera de alcance inicial

- Validación psicométrica formal con muestra estadística.
- Diagnóstico o recomendaciones profesionales personalizadas.
- Cambiar umbrales, catálogos de resultados o pesos sin una decisión metodológica independiente.
