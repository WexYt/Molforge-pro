# ADR-004: logP, hidrógeno manual, orbitales y perfil sin servidor

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** WEX (propietario)

## Contexto
La v0.7 pide logP en las reglas, hidrógeno que no se agregue solo, emblemas animados, corregir XP, un logro final con orbitales s, p, d y f, y un usuario para compartir logros y llevar los datos a otro dispositivo. Debe seguir funcionando sin servidor ni cuentas.

## Decisiones
- **logP por Moriguchi (MLOGP)**: una fórmula cerrada que se puede implementar y revisar en poco código. Se descartaron Crippen/XLogP por necesitar tablas de decenas de tipos de átomo que no se pueden verificar sin red. Se validó contra 30 moléculas con valor experimental: RMSE 0,70, error medio absoluto 0,47. Se muestra como estimación.
- **Hidrógeno manual** con un bandera global en `chem.js` (`setAutoH`) y dos conversiones: `explicitize` (implícito → átomos H) y `collapseH` (átomos H → conteos). El reconocimiento y las reglas siempre trabajan sobre la molécula «colapsada».
- **XP**: migración que fija `xp ≥ suma de los retos hechos + 15 por descubrimiento`; umbrales de nivel tales que los 16 retos (950 XP) equivalen al nivel 7, requisito del logro final junto con los 16 retos.
- **Orbitales**: armónicos esféricos reales (parte angular, conjunto cúbico para f) como nubes de puntos con mezcla aditiva; capas con anillos por subcapa. Configuración electrónica por Aufbau con excepciones conocidas. No se modela la parte radial.
- **Perfil sin servidor**: usuario + código aleatorio de 6 caracteres generado en el dispositivo (≈ 7·10⁸ combinaciones); logros compartidos como código `WEX1.` (JSON comprimido en base64url) o tarjeta PNG; datos completos en archivo JSON con combinar/reemplazar.

## Consecuencias
- El identificador es único en la práctica, no verificado: sin servidor no se puede impedir que dos personas elijan el mismo nombre.
- Los códigos de logros se pueden fabricar a mano; son informativos, no una prueba.
- Moriguchi tiene error típico de 0,5 a 1 unidad de logP; para decisiones reales hay que usar herramientas validadas.
