# Implementation Plan: Opciones uniformes del cuestionario

> Plan governing spec: `docs/superpowers/specs/2026-10-12-uniform-question-options.md`

## Task 1 — Normalizar las opciones de respuesta

- **Archivos:** `src/index.css`, `tests/question-options.test.js`.
- **Interfaces:** clases existentes `.scale`, `.scale--rating`, `.scale--choices`, `.scale__label` y estados de radio; sin cambios en `Quiz` ni en los datos.
- **RED:** crear prueba de contrato CSS para columnas estables, etiquetas uniformes y ausencia de reglas que vuelvan a comprimir la escala; ejecutar `node --test tests/question-options.test.js` y confirmar fallo.
- **GREEN:** ajustar solo CSS y volver a ejecutar `node --test tests/question-options.test.js`.
- **Verificación:** `npm test`, `npm run build`; inspección de diff para no alterar estilos del editor.
- **Commit boundary:** `fix: make questionnaire response options readable and consistent`.

## Revisión

Comparar implementación con la especificación y revisar que el cambio solo afecte a las opciones del cuestionario, conservando selección y foco.
