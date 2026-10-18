# Implementation Plan: Números enteros en prioridades

> Plan governing spec: `docs/superpowers/specs/2026-10-12-whole-number-priority-scale.md`

## Task 1 — Usar una escala entera solo en prioridades

- **Archivos:** `src/data/response-scales.json`, `tests/priority-scale.test.js`.
- **Interfaz/datos:** nueva escala compartida `priority_1_10`; `optionsFor` ya la leerá y no necesita código adicional.
- **RED:** `node --test tests/priority-scale.test.js`, con expectativa de exactamente opciones 1–10 y uso en los IDs de prioridades; confirmar fallo.
- **GREEN:** cambiar `responseScale` de cada pregunta `*_IMP_01` y `*_CAM_01` a `priority_1_10` y volver a ejecutar el archivo.
- **Verificación:** `node --test tests/priority-scale.test.js tests/rendering.test.js`, `npm test`, `npm run build`.
- **Commit boundary:** `fix: use whole-number priorities in the questionnaire`.

## Revisión

Confirmar que solo cambian los IDs de prioridades, que no hay estilos que deban duplicarse para el nuevo tipo de escala y que las preguntas de contexto y los resultados quedan intactos.
