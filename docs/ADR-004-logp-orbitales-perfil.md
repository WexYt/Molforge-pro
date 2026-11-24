# ADR-004: logP, hidrógeno manual, perfil sin servidor y orbitales

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** WEX (propietario)

## Contexto
La v0.7 pide logP, hidrógeno manual, logos animados, perfil para compartir logros y mover datos entre dispositivos, corregir el XP y un logro final con capas y orbitales en 3D. Debe seguir siendo estático, gratis y funcionar sin conexión.

## Decisiones
- **logP por Moriguchi (MLOGP):** fórmula cerrada y reproducible con la estructura (sin tablas grandes). Validada con 30 compuestos de referencia: error medio absoluto 0,47 y RMSE 0,70. Alternativa descartada: Wildman-Crippen completo (68 tipos de átomo que no se pueden verificar aquí).
- **Hidrógeno manual:** bandera global `AUTO_H` en `chem.js`. Con ella apagada los H son átomos reales; `collapseH` los pliega a conteos para fórmula, reglas y reconocimiento. Al cambiar de modo se convierten los H implícitos en átomos (`explicitize`) o al revés.
- **Usuario sin servidor:** `nombre#CÓDIGO` con 6 caracteres aleatorios generados en el dispositivo; no hay garantía global de unicidad. Se comparte un código `WEX1.…` (JSON comprimido con gzip) o una tarjeta PNG; los datos completos se mueven con un archivo JSON.
- **XP y niveles:** umbrales fijos (0, 100, 250, 420, 620, 800, 950). Las 16 misiones suman 950 XP y llevan al nivel 7. Al cargar, se recalcula el XP mínimo a partir de los retos hechos para no perder progreso.
- **Orbitales:** armónicos esféricos reales para las formas angulares (s, p, d y el conjunto cúbico de f) como nubes de puntos; configuración electrónica por Aufbau con las excepciones conocidas.

## Consecuencias
- El logP es una estimación; se indica en la interfaz.
- Cualquier usuario puede editar su `localStorage` y saltarse los retos: es un juego, no seguridad.
- Los orbitales muestran la parte angular, no la distribución radial.
