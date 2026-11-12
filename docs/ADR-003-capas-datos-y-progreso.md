# ADR-003: Datos locales, historial con origen y retos

**Status:** Accepted · **Date:** 2026-11-08 · **Deciders:** WEX (propietario)

## Contexto
La v0.6 pide historial con fecha y origen (aviso de PubChem), biblioteca del dispositivo, desbloqueos, tabla periódica completa, más reglas de fármaco, modo escritorio y vidrio líquido. Todo debe seguir siendo gratis, sin servidor y funcionar sin conexión.

## Decisión
- **Persistencia en `localStorage`** (claves `wex-hist`, `wex-mine`, `wex-prog`, `wex-opts`, `wex-theme`): simple, sin dependencias y suficiente (cada molécula ocupa ~1–2 KB).
- **Origen explícito** en cada registro (`crea`, `mod`, `bib`, `pub`, `imp`, `mine`). Una molécula de PubChem o de la biblioteca pasa a `mod` al primer cambio; solo `crea` y `mod` cuentan para descubrimientos y retos.
- **Retos como datos**: la lista `MIS` en `assets/app.js` y la columna final de `data/moleculas.txt` enlazan reto y compuesto.
- **Elementos generados** desde `tools/build_elementos.py` (118 elementos con familia, valencia y radios aproximados para los pesados).
- **Diseño responsivo por CSS** (rejilla de 1, 2 y 3 paneles) con el mismo JavaScript; el inspector del escritorio reutiliza las funciones de datos y reglas.
- **Vidrio líquido** solo en el tema Cristal y sobre elementos pequeños; en Safari/Firefox el módulo usa un esmerilado de respaldo.

## Alternativas
| Opción | Veredicto |
|---|---|
| IndexedDB | Descartada por ahora: más código para el mismo resultado |
| Cuenta de usuario y servidor | Descartada: rompe el modo sin conexión y el costo cero |
| Retos con lógica en el servidor | Descartada: sin servidor |

## Consecuencias
- Los datos viven en el dispositivo: sin respaldo se pierden al borrar el navegador (hay exportación JSON).
- Los retos se pueden reiniciar o manipular desde el navegador; no son seguridad, son juego.
- TPSA y reglas son aproximaciones sin logP; se indica en la interfaz.
