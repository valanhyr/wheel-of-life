# Editor local de JSON del cuestionario

## Decisiones acordadas
- Editor disponible solo al ejecutar Vite en desarrollo local, no en la app publicada.
- Permitir modificar todo el objeto de una pregunta (incluidos ID, escala, pesos, factores), crearla y eliminarla.
- Permitir actualizar las reglas de cada área y las escalas de respuesta para mantener coherencia de referencias y modificar puntuaciones; rechazar cambios con referencias rotas, no intentar recalibrar automáticamente.
- Guardar directamente en JSON versionados y seguir usándolos como fuente de verdad hasta una futura migración a base de datos.

## Criterios de aceptación
- API de autoría solo en servidor de desarrollo ligado a loopback, lectura y escritura de `questions.json`, `response-scales.json` y de los ocho `*-rules.json`, con rechazo de requests de otro origen y cuerpos grandes.
- Escritura con control de revisión para evitar sobrescribir cambios concurrentes, validación antes de guardar, y conservación de archivos intactos ante errores de validación. Respuesta de error útil.
- Validar estructura, IDs únicos, área/dimensión existentes, escala/opciones compatibles, pesos/factores, y correspondencia exacta entre preguntas puntuables y `question_ids` de reglas por dimensión; validar referencias de contexto en reglas. La app no debe romperse por preguntas eliminadas sin resolver referencias fijas en `scoring.js`.
- UI con vista legible por área/dimensión y editor JSON de todos los atributos de la pregunta, crear y eliminar con confirmación; editor JSON de reglas del área para cambios estructurales, botón de guardar, errores visibles. Mantener cambios sin guardar en memoria al navegar; cargar estado del servidor y advertir si se sale con cambios.
- Los datos de autoría no modifican las respuestas ya en curso. Al guardar, indicar que deben recargarse app y pruebas; la comprobación `npm test`/`npm run build` sigue siendo necesaria para publicar cambios semánticos.
- La app de producción no muestra ni incluye la vista de autoría ni la API.
