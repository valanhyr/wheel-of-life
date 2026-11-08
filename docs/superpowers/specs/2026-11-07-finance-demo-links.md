# Fichas Demo para probar enlaces de Finanzas

## Alcance
Complementa `docs/superpowers/specs/2026-11-01-finance-resource-routes.md`. En desarrollo, después de completar Finanzas, mostrar fichas de prueba para ensayar la navegación hacia futuros recursos externos sin introducir destinos inventados en el catálogo editorial. Los enlaces de prueba pueden no existir; deben identificarse antes de pulsarlos.

## Aceptación
- Desarrollo: aparece una sección «Fichas Demo · solo desarrollo» con ejemplos de herramienta propia y ficha de colaboración, enlaces HTTPS a rutas de prueba en `example.com`, que se abren en otra pestaña con `rel="noopener noreferrer"`. Se advierte que pueden mostrar error y que no son recursos ni afiliaciones reales.
- Producción: no aparecen la sección, su texto ni los enlaces de prueba; tampoco deben figurar en el bundle generado. El catálogo real y el selector de rutas no incorporan los datos demo.
- Finanzas incompleta y otras áreas: no se muestran fichas demo. No se cambian scoring, decisiones editoriales ni enlaces reales.
- Pruebas RED/GREEN, `npm test` y `npm run build` aprobados.
