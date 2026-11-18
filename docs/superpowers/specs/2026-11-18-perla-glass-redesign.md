# Rediseño visual "Perla": cristal claro

## Alcance

Se sustituye el aspecto actual de la aplicación (tema oscuro violeta/cian) por el tema **Perla**: un
diseño claro con transparencias ("glassmorphism"), fondo con orbes de color suaves, tarjetas de cristal,
animaciones de entrada y microinteracciones. La referencia visual aprobada es
`docs/design/theme-proposals/glass.html` con `data-theme="perla"`.

No cambia la lógica de puntuación, los datos (`src/data/*.json`), los textos, el flujo de navegación
(rueda → intro → autoevaluación → cuestionario → resumen), ni el editor local de preguntas más allá de
heredar los nuevos tokens.

## Decisiones

- Solo se adopta **Perla**. Aurora, Neón y Océano se descartan por exceso de color.
- Paleta contenida: base lavanda/blanco, acento violeta `#6d4aff` a cian `#0ea5c6`. Los colores
  saturados se reservan para los 8 sectores de la rueda y los indicadores de estado.
- Tipografías: `Sora` (títulos y cifras) e `Inter` (texto). Se cargan desde Google Fonts con
  `font-display: swap` y fallback a `system-ui`.
- No se añaden dependencias. `framer-motion` ya instalado puede usarse; no es obligatorio.

## Sistema de diseño (tokens)

Todos los valores visuales viven como variables CSS en `:root` de `src/index.css`:

- Superficies: `--glass`, `--glass-2`, `--glass-border`, `--glass-hi`.
- Texto: `--text`, `--muted`. Acentos: `--accent`, `--accent-2`, `--accent-ink`, `--accent-grad`, `--glow`.
- Áreas: `--a1` a `--a8`, en el orden de `areas` de `questions.json`.
- Forma y efecto: `--blur`, `--shadow`, radios.
- Los selectores existentes (`.section`, `.btn`, `.resource-route__*`, `.editor__*`, etc.) pasan a
  consumir estos tokens en lugar de colores literales. Los nombres de clase no cambian.

## Criterios de aceptación

1. **Fondo:** tres orbes difuminados animados detrás del contenido y rejilla sutil, con
   `pointer-events: none` y `aria-hidden`.
2. **Tarjetas:** `backdrop-filter` con saturación, borde degradado, brillo interior y entrada escalonada.
3. **Rueda:** los sectores crecen al cargar; al pasar el ratón o enfocar con teclado, el sector se
   resalta y el centro muestra su nota y nombre; por defecto muestra la media de las áreas publicadas
   (o no muestra cifra si ninguna tiene nota). Un área sin nota completa nunca se dibuja con valor.
4. **Cabecera:** acción principal destacada; Exportar, Importar y Reiniciar son secundarias. En móvil las
   secundarias se agrupan o reducen para no ocupar varias filas.
5. **Stepper y progreso:** el stepper en píldora conserva `aria-current="step"`; el progreso se muestra
   con el anillo cónico y mantiene `role="progressbar"` con `aria-valuenow`.
6. **Accesibilidad:** contraste de texto mínimo AA sobre el cristal; foco visible en todos los
   controles; objetivos táctiles de al menos 44 px; `prefers-reduced-motion` desactiva animaciones;
   fallback opaco cuando no existe `backdrop-filter`.
7. **Responsividad:** sin desbordamiento horizontal a 360, 390, 768, 1024 y 1440 px. La rueda y el
   panel se apilan por debajo de 980 px.
8. **Cobertura de pantallas:** el nuevo estilo se aplica a landing, intro, autoevaluación, cuestionario,
   resumen de área, ranking, rutas de recursos de finanzas y editor local de preguntas.
9. **Rendimiento:** orbes animados con `transform` solamente; se limita el blur en móvil.
10. **Sin regresiones:** `npm test` y `npm run build` pasan con los mismos resultados que antes del cambio
    (97 tests, 0 fallos en Node 26.13.1).

## Fuera de alcance

- Modo oscuro y selector de tema en la app. Se deja la estructura de tokens preparada para añadirlo.
- Cambios de copy, contenido de preguntas o reglas de puntuación.
- Nuevas librerías de UI o de iconos.

## Verificación

Además de los tests, captura de pantalla con Edge headless de landing, cuestionario y resumen a 390, 768
y 1440 px, y revisión manual de foco por teclado y `prefers-reduced-motion`.
