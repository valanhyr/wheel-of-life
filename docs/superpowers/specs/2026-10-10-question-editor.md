# Editor de preguntas (2026-10-10)

## Objetivo
Permitir consultar las preguntas por área y dimensión, buscar por texto/ID, editar enunciados y crear preguntas sin instalar un CMS ni backend.

## Alcance y aceptación
- Acceso desde la cabecera de la aplicación; volver al cuestionario sin perder respuestas.
- Lista por área y dimensión, con ID, tipo (puntuable/prioridad/contexto), escala y polaridad visibles; búsqueda textual.
- Editar el texto de una pregunta existente sin cambiar su ID ni metadatos de medición.
- Crear preguntas copiando la configuración completa de una pregunta del área seleccionada, con ID nuevo único y enunciado no vacío. Advertir que crear preguntas puntuables requiere revisar reglas, resultados y pruebas antes de publicar.
- Borrador persistido en localStorage por navegador, separado del cuestionario activo; exportación de un `questions.json` completo conservando campos ajenos a las preguntas. No sugerir que la exportación modifica el archivo del proyecto o el cuestionario en ejecución.
- Posibilidad de descartar el borrador y volver al contenido original. Validar datos almacenados antes de usarlos; nunca borrar el catálogo original.
- Sin autenticación ni escritura en servidor; la vista es una herramienta editorial local, no un CMS multiusuario.
