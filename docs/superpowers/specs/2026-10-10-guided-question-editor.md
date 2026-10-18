# Editor guiado del cuestionario

## Alcance acordado
Evolucionar el editor local existente para mantener integridad sin editar manualmente referencias en varios JSON. JSON sigue siendo la fuente hasta migrar a BD; no se cambia el motor de puntuación ni los resultados existentes por esta tarea.

## Criterios de aceptación
- Cada pregunta existente recibe una identidad interna `uid` única e inmutable (migración única sin cambiar sus IDs públicos); las nuevas reciben `uid` nuevo. El editor permite cambiar `id` público, pero no `uid`; la API impide colisiones y cambios de identidad. Los IDs fijados en `scoring.js` siguen bloqueados mientras no se migre ese código.
- Crear/editar/mover/eliminar preguntas sincroniza automáticamente los `question_ids` de las dimensiones y los `questionId` de las reglas de contexto. Al marcar/desmarcar puntuable, se actualiza su pertenencia a una dimensión. El orden del cuestionario y el resto de datos permanecen estables. No eliminar la última pregunta de una dimensión: está protegida por el validador.
- Edición guiada de escalas con número de preguntas afectadas. Se puede editar una escala compartida o duplicarla y asignar la copia a una pregunta sin alterar otras. Validar puntuaciones y opciones antes de guardar.
- Vista previa de cambios contra el último snapshot cargado: altas/bajas/IDs/dimensiones/escalas/textos y áreas afectadas; para cambios de medición, comparar puntuación ponderada usando los fixtures sintéticos de las ocho áreas, remapeando respuestas por `uid` cuando el ID público cambie, con resultados no comparables marcados cuando falten respuestas. Se requiere confirmar el impacto antes del PUT.
- Guardar desde la API solo con revisión actual, integridad validada y escritura con restauración ante errores. Los IDs públicos modificados requerirán migración externa para respuestas reales previas: advertir explícitamente; el editor nunca migra respuestas reales.
- Los JSON avanzados permanecen disponibles para ajustes excepcionales; los controles guiados son el camino principal. Verificación `npm test` y `npm run build`.
