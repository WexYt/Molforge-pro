# ADR-001: Alojar WEX MolForge Pro en GitHub Pages (sitio de usuario)

**Status:** Accepted (v2: subruta /Molforge-pro/)
**Date:** 2026-11-06
**Deciders:** WEX (propietario)

## Context
La app real (React + TanStack Router, empaquetada con Vite) está en Netlify: página de inicio, Forja 3D (construcción átomo a átomo, descriptores, Lipinski, export XYZ/Molfile), Biblioteca y Fuentes. No llama a ninguna API ni función de servidor: los compuestos (con CID de PubChem, ID de ChEMBL y ligando PDB) viven dentro del bundle (`fixtures-*.js`). Es 100 % estática. El propietario quiere dejar de depender de Netlify y usar solo GitHub.
Restricciones: uso personal, costo cero, una sola persona, sin servidor.

## Decision
Publicar los archivos compilados (`index.html` + `assets/`) en el repositorio `Molforge-pro` (GitHub Pages de proyecto, rama `main`, raíz; URL `/Molforge-pro/`). Añadir `.nojekyll`, quitar scripts/metadatos de Netlify y usar `404.html` como respaldo para rutas internas (/forja, /biblioteca).

## Options Considered

### Option A: Copiar el build compilado a un sitio de usuario (elegida)
| Dimension | Assessment |
|---|---|
| Complejidad | Baja |
| Costo | Gratis |
| Escalabilidad | Suficiente (archivos estáticos con CDN) |
| Familiaridad | Alta: solo subir archivos |

**Pros:** funciona hoy, sin instalar nada; rutas absolutas `/assets/...` válidas en la raíz del dominio.
**Cons:** no hay código fuente editable; hay que descargar a mano 3 chunks faltantes; recarga directa en /forja usa 404.html (puede mostrar errores de hidratación en consola).

### Option B: Reconstruir desde el código fuente con GitHub Actions
| Dimension | Assessment |
|---|---|
| Complejidad | Media-Alta |
| Costo | Gratis |
| Escalabilidad | Alta |
| Familiaridad | Baja |

**Pros:** código editable y versionado; despliegue automático; rutas prerenderizadas.
**Cons:** requiere el fuente (src, package.json), que no está en lo recibido; el build actual parece de TanStack Start y habría que configurarlo en modo estático/SPA.

### Option C: Mantener Netlify
**Pros:** ya funciona. **Cons:** es justo la dependencia que se quiere evitar.

## Trade-off Analysis
A da independencia inmediata con el menor esfuerzo; B es la mejor a largo plazo pero depende de recuperar el código fuente. Se elige A ahora y se deja B como siguiente paso.

## Consequences
- Más fácil: publicar, probar y mover el sitio; no hay cuentas ni servicios extra.
- Más difícil: modificar la app (solo existe el código minificado).
- A revisar: recuperar el fuente (repo WexYt/wex-molforge o "Download deploy" de Netlify), pasar a Option B, y autoalojar las tipografías de Google Fonts.

## Action Items
1. [ ] Descargar los 3 archivos faltantes a `assets/` (ver FALTAN-3-ARCHIVOS.txt).
2. [ ] Subir todo al repo `wexyt.github.io` y verificar /, /forja y /biblioteca.
3. [ ] Localizar el código fuente y evaluar Option B.
4. [ ] Autoalojar fuentes y favicon original.

## Actualización v2 (2026-11-06)
El propietario quiere conservar el nombre `Molforge-pro`. Como el build original asume la raíz `/`, se parcheó el bundle para la subruta `/Molforge-pro`: (1) `basepath` del router, (2) prefijo del cargador de módulos y del favicon en `index-BZHH0yOC.js`, (3) rutas `/assets/` y `href="/..."` en `index.html` y `404.html`.
Consecuencia: si se renombra el repositorio, hay que repetir el parche con el nuevo nombre. Con el código fuente, la solución limpia es configurar `base` de Vite y `basepath` del router.
