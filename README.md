# wheel-of-life
Aplicación React para comparar la percepción inicial de ocho áreas de la vida con un cuestionario y explorar sus resultados.

## Desarrollo

- `npm install`
- `npm run dev`
- `npm test` (Node 22.12 o posterior)
- `npm run build`

## Datos y cálculo

- `src/data/questions.json`: ocho áreas y 216 preguntas. Cada área aporta 22 puntuables con factores transversales, 1 de prioridad y 4 de contexto.
- `src/data/response-scales.json`: escalas compartidas de respuesta. Las opciones incluyen su puntuación y las escalas numéricas indican si se invierten.
- `src/data/finance-rules.json`: dependencias por dimensión, pesos, desempates y notas de contexto.
- `src/data/finance-results.json`: catálogo de interpretaciones financieras.
- `src/data/work-rules.json`: dependencias, pesos, desempates y notas de contexto de Trabajo.
- `src/data/work-results.json`: interpretaciones por área, dimensión, percepción, factores transversales y patrones de Trabajo.
- Las seis áreas restantes tienen sus propios archivos `*-rules.json`, `*-results.json` y ejemplos `tests/fixtures/*-demo.json`, según la tabla siguiente.
- `src/data/additional-areas.js`: registro de los catálogos y reglas de las seis áreas ampliadas.
- `src/data/actions.json`: textos generales anteriores y ejercicios de reflexión compartidos.
- `src/data/scoring.js`: normalización, agregación y selección de resultados. Las expresiones descriptivas del catálogo no se ejecutan como código.

Finanzas procede de `work/rueda_vida_demo_finanzas_trabajo_v02_cuestionario_finanzas.json`, sección `questionnaires.Finanzas`. Las respuestas antiguas de `answers` corresponden al piloto anterior y no se usan. El ejemplo v02 está aislado en `tests/fixtures/finance-demo.json`; nunca se precarga en la aplicación.

Trabajo conserva las doce preguntas de trabajo del piloto y amplía el cuestionario a 22 puntuables: Satisfacción (5), Desarrollo (5), Condiciones (6) y Proyección (6). Todas alimentan factores transversales mediante `factors` y `factorWeights`, como en Finanzas; no son preguntas adicionales. La pregunta de prioridad y las cuatro de contexto completan las 27 del bloque. El ejemplo sintético está en `tests/fixtures/work-demo.json` y nunca se precarga. La prioridad usa números enteros del 1 al 10. Las escalas reutilizan las de Finanzas.

## Áreas completas

Las seis áreas ampliadas conservan sus cuatro dimensiones y sus preguntas originales. Cada bloque contiene 5, 5, 6 y 6 preguntas puntuables en el orden de dimensiones indicado. Todas incluyen asociaciones a factores transversales; no se añaden preguntas extra para calcular esos factores.

| Área | Prefijo de archivos | Dimensiones (5 / 5 / 6 / 6 preguntas) |
| --- | --- | --- |
| Salud | `health` | Hábitos · Energía y vitalidad · Cuidado preventivo · Relación con el cuerpo |
| Emocional | `emotional` | Gestión emocional · Estrés y carga mental · Autoestima · Calma y satisfacción |
| Relaciones | `relationships` | Calidad de los vínculos · Comunicación · Límites · Apoyo y reciprocidad |
| Familia | `family` | Conexión · Comunicación · Reparto de responsabilidades · Tiempo y presencia |
| Trabajo | `work` | Satisfacción · Desarrollo · Condiciones · Proyección |
| Finanzas | `finance` | Control · Seguridad · Hábitos financieros · Proyección |
| Crecimiento | `growth` | Autoconocimiento · Aprendizaje · Objetivos · Coherencia |
| Ocio | `leisure` | Tiempo disponible · Disfrute · Descanso · Prioridad personal |

Por ejemplo, Salud utiliza `src/data/health-rules.json`, `src/data/health-results.json` y `tests/fixtures/health-demo.json`. Los ejemplos son sintéticos y nunca se precargan en la aplicación. Los seis nuevos ejemplos incluyen puntuaciones esperadas para verificar sus cálculos.

La percepción de cada área se recoge al iniciar su sección del cuestionario. La prioridad y el contexto se preguntan dentro del cuestionario y no afectan a la nota. Cada dimensión pesa un 25 %, independientemente de su número de preguntas. No se publica la nota del área hasta completar sus 22 preguntas puntuables; las dimensiones incompletas se etiquetan como parciales. Solo se redondea al mostrar el resultado. La rueda, la comparación, las alertas y el detalle utilizan el mismo resultado calculado.

Las señales transversales se calculan por separado en las ocho áreas, exigen al menos dos respuestas por factor y se muestran como provisionales. No se combinan todavía entre áreas. El primer foco es la dimensión más baja; entre dimensiones a no más de 0,25 puntos del mínimo se utiliza el orden `focusOrder` de cada archivo de reglas. Los patrones globales de puntuaciones bajas o estables tienen precedencia sobre los patrones parciales. Finanzas y Trabajo conservan sus patrones anteriores.

Las seis áreas nuevas incluyen ocho lecturas de patrones: puntuaciones bajas en todo, estabilidad en todo, cuatro contrastes entre dimensiones, base equilibrada para mejorar y lectura mixta. Las reglas `patternRules` contienen comparaciones explícitas `gte` y `lt` y se comprueban en orden, después de los patrones globales. Las cadenas `condition` de los catálogos son documentación; no se evalúan como código. Las reglas `contextRules` seleccionan notas por respuestas concretas sin alterar las puntuaciones.

La brecha visible conserva el sentido de la aplicación: resultado menos percepción. Los catálogos usan internamente el signo opuesto. Todas las áreas aplican las bandas 4, 6 y 7,5 y la tolerancia de alineación de menos de 1 punto. Las seis áreas ampliadas dejan de publicar medias parciales y adoptan las mismas reglas de completitud y comparación que Finanzas y Trabajo.

Los textos de Salud y Emocional describen experiencias cotidianas de cuidado y bienestar, sin diagnóstico clínico. El contexto de cada bloque permite recoger cambios recientes, límites de recursos y preocupaciones. Familia admite como referencia la familia elegida y contempla la distancia sin convertir más contacto en un objetivo obligatorio.

Las respuestas permanecen en memoria durante la sesión. La navegación usa «Siguiente» para permitir revisar cada selección antes de continuar.

## Verificación

`npm test` comprueba estructura, escalas, ponderación, contexto, factores, patrones, umbrales, respuestas incompletas e independencia entre áreas. También renderiza las 224 preguntas, los ocho detalles de resultado y los puntos de la rueda con ejemplos completos y parciales. `npm run build` verifica la compilación de producción.
