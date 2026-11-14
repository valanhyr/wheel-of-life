# Exportar e importar progreso en JSON — primera prueba

## Objetivo
Permitir descargar las respuestas actuales y volver a cargarlas días después, sin cuenta, servidor ni almacenamiento automático. La importación reconstruye resultados y recomendaciones desde los catálogos vigentes, no restaura instantáneas de recursos.

## Formato y comportamiento
- JSON legible y versionado con identificadores estables `uid` de pregunta y valor de opción (sin texto de preguntas, etiquetas, puntuaciones, rutas ni enlaces), y valoraciones de las ocho áreas por ID. Incluye fecha de exportación orientativa.
- Exportación manual desde la cabecera; importación mediante selector de archivo JSON. Solo se aplica tras validar el archivo completo y confirmar que sustituirá el progreso actual. Cancelar o un error conserva el estado previo.
- Validar formato, versión, estructura, tamaño, duplicados, UIDs conocidos, valores permitidos por el catálogo actual, áreas y valoraciones 0–10. Ante incompatibilidades por cambios de opciones/preguntas, rechazar con un mensaje comprensible, sin restauración parcial.
- Después de importar, mostrar la rueda; al seleccionar un área, permitir continuar donde falten respuestas o ver los resultados ya completos. La selección manual de ruta/paso y descartes de recursos no se conserva.
- Avisar de que el JSON no está cifrado y contiene datos personales legibles. No usar `atob`/`btoa` como protección.

## Aceptación
- Exportar e importar un progreso parcial y uno completo mantiene respuestas y percepción sin incluir textos ni recursos; las rutas/recursos se recalculan con el catálogo actual.
- Archivos malformados, demasiado grandes, alterados o incompatibles y cancelaciones no cambian el estado previo.
- `npm test` y `npm run build` pasan.
