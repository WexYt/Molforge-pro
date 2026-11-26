# Verificación · WEX MolForge Pro v0.8.1 beta

Fecha: 26 de noviembre de 2026. Empaquetado final por el agente de
empaquetado (esta verificación es **propia**: se corrieron las pruebas de
nuevo sobre la carpeta `Molforge-pro-v0.8.1-beta/` ya con la versión 0.8.1;
lo que viene de los dos agentes anteriores se marca como tal).

## 1. Qué se corrigió (las 3 capturas de Wex)

### Captura 1 — Hoja Opciones (2:07): nota de hidrógeno manual
- **Error que se veía:** la nota «Hidrógeno manual activado (Ajustes): los H
  solo se añaden a mano, así que "Mostrar hidrógenos" no tiene efecto»
  aparecía en la hoja Opciones. La duda era si reflejaba el estado real.
- **Causa raíz (verificado en el código):** en la v0.8 la nota ya era
  condicional (`S.manualH ? … : ''`), pero el interruptor «Mostrar
  hidrógenos» seguía vivo y con su descripción normal («Se completan solos
  según la valencia»), así que la hoja se contradecía a sí misma: la nota
  decía que no tenía efecto mientras el interruptor parecía funcionar.
- **Arreglo (agente de layout):** la fila «Mostrar hidrógenos» ahora dice
  «Sin efecto: hidrógeno manual activado en Ajustes» cuando el modo manual
  está prendido, el checkbox queda `disabled` (y se ve apagado aunque su
  valor guardado sea «on»: `input[type=checkbox]:disabled` en `app.css`),
  y la nota solo se renderiza con el modo prendido.
- **Verificado por mí:** E2E propio (`test-layout.mjs` §6) — con el modo
  apagado no hay nota, `o-h` habilitado y descripción «Se completan solos»;
  con el modo prendido desde Ajustes aparece la nota, `o-h` deshabilitado
  y descripción «Sin efecto». Captura `shots-v081/opciones-manual-on-390.png`.

### Captura 2 — Pestaña Retos (2:08): barra inferior y tarjeta Logro final
- **Error 1, barra inferior:** son 5 pestañas y la última salía cortada
  como «Aju…».
- **Causa raíz:** `#tabbar button` con `flex:1` y `font-size:.7rem` sin
  `min-width:0`; en 360 px el texto no cabía y se cortaba.
- **Arreglo (agente de layout):** `flex:1 1 0; min-width:0`, fuente
  `.64rem` (`.6rem` ≤ 400 px), iconos 20 px (18 px ≤ 400 px), `padding`
  6 px, y el `span` con `white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis` como red de seguridad.
- **Verificado por mí:** E2E propio §1–2 — a 390 px y a 360 px las 5
  etiquetas se ven completas sin corte (derechos: 79/156/232/309/386 a
  390 px; 73/144/214/285/356 a 360 px) y las 5 pestañas se activan sin
  desbordamiento horizontal.
- **Error 2, tarjeta Logro final:** el texto se cortaba a media palabra
  («Capas de electrones…») y el botón «Ver orbitales» lo apretaba.
- **Causa raíz:** `.final` era una fila (`display:flex`) con el botón a la
  derecha; en la columna de Retos (≤ ~420 px) el texto quedaba con ~100 px.
- **Arreglo (agente de layout):** `.final` ahora es columna
  (`flex-direction:column`): arriba emblema + texto, abajo el botón
  «Ver orbitales» a ancho completo.
- **Verificado por mí:** E2E propio §3–4 — bloqueado (0/16, 0 XP) y
  desbloqueado (950 XP, 16/16): `b` y `small` sin corte
  (`scrollWidth ≤ clientWidth`), botón debajo del texto y dentro del
  ancho, y el botón lleva a la pestaña Orbitales. Capturas
  `shots-v081/retos-390.png`, `retos-final-390.png` (tarjeta completa) y
  `retos-bloqueado-390.png`. Revisé la captura final a ojo: el texto
  «Capas de electrones y orbitales 3D s, p, d y f» se lee entero.
- **Resto de lo visible en la captura 2 (revisado):** la fila de tarjetas
  de arriba (nivel/emblema) y las misiones no se desbordan; la rejilla de
  desbloqueables y «Descubrimientos» tampoco. Sin más cortes.
- **Lo bueno que confirma la captura 2 (verificado):** la reparación de XP
  funcionó — Wex tiene el Logro final desbloqueado (16/16, 950 XP).

### Captura 3 — Pestaña Orbitales (2:08): barra inferior y selector
- **Error:** la barra inferior también salía cortada («Aju…»); el selector
  de elemento era el otro punto de riesgo de desborde.
- **Causa raíz:** la misma de la barra (ver arriba); el selector
  `.orb-sel select` tenía `flex:1` sin `min-width:0` ni elipsis.
- **Arreglo (agente de layout):** barra igual que en la captura 2;
  `.orb-sel` con `min-width:0`, `span` con `flex:none` y el `select` con
  `flex:1 1 0; min-width:0; max-width:100%` y elipsis. También se añadió
  elipsis a los botones `.seg` (modos de orbital) y `minmax(96px,1fr)` a
  la rejilla de desbloqueables.
- **Verificado por mí:** E2E propio §5 — selector sin desborde a 390 px
  (ancho 240 px, overflow 0); Carbono (Z 6) muestra
  `[He] 2s² 2p²`, capas K:2 · L:4 y valencia 4, igual que en la captura de
  Wex. Captura `shots-v081/orbitales-390.png` (revisada a ojo: selector,
  modos y visor 3D sin cortes).
- **Lo bueno que confirma la captura 3 (verificado):** Orbitales renderiza
  bien y los datos de Carbono son correctos.

## 2. Qué se añadió

### Decoración navideña (agente de Navidad/buzón)
- Nieve ligera (24 copos CSS, `assets/navidad.js`, 40 líneas) y un 🎄 en el
  encabezado, con interruptor en Ajustes («Decoración navideña»): prendida
  por defecto solo en diciembre, la preferencia guardada (`wex-navidad`)
  manda siempre. Respeta `prefers-reduced-motion` (la nieve se oculta).
  Código aislado para quitarlo en enero (un archivo + un `<script>` +
  una clase + un bloque CSS).
- **Verificado por mí (suite previa, recorrida de nuevo):** 41/41 checks —
  apagada por defecto en noviembre, prende/apaga al instante con clase
  `xmas` + nieve + preferencia guardada, 24 copos, árbol visible,
  `reduced-motion` sin animación, prendida por defecto con fecha simulada
  de diciembre. Captura `shots-v081/ajustes-navidad-on-390.png` (revisada
  a ojo: copos y toggle prendido).

### Buzón de sugerencias (agente de Navidad/buzón)
- Sección en Ajustes (no es una 6.ª pestaña): publicar título + texto,
  guardado local (`wex-sugerencias`), estado vacío que explica cómo
  funciona sin inventar ideas; votar con ⭐ (un voto por dispositivo, se
  quita tocando de nuevo), comentarios, compartir como texto
  (Web Share o portapapeles), «Publicar en GitHub» (abre
  `issues/new` prellenado) y «Ver sugerencias de la comunidad».
- Viaja con la exportación/importación de datos (campo `sugerencias` en el
  JSON; fusión por `id`, reemplazo completo).
- Comunidad: lee los Issues abiertos del repo con la API pública de GitHub
  (sin token), solo lectura, con reacciones y nº de comentarios, enlace a
  cada Issue; sin internet o si la API falla muestra el buzón local con
  nota clara. La interfaz dice en todo momento qué es local y qué es de
  la comunidad.
- **Verificado por mí (suite previa, recorrida de nuevo):** 41/41 checks —
  publicar, votar/quitar voto, comentar, compartir (portapapeles),
  URL de GitHub prellenada con `v0.8.1`, exportar/importar con
  sugerencias (fusión y reemplazo), caída elegante sin internet.
- **Límites honestos:** sin servidor, los votos y comentarios locales NO
  se comparten con nadie (solo los ve el dispositivo); los votos de
  verdad se hacen en GitHub, abriendo el Issue.

## 3. Verificación de la API de GitHub Issues (punto pendiente)

El agente del buzón no pudo verificar la lista de la comunidad contra la
API viva (su Chromium no llegaba a `api.github.com`). Lo verifiqué yo:

- **Con `curl` (API viva, sin token):**
  `GET https://api.github.com/repos/WexYt/Molforge-pro/issues?state=open&per_page=20`
  → HTTP 200, cuerpo `[]`: **el repo hoy tiene 0 Issues abiertos**, así
  que la lista de la comunidad debe mostrar «No hay Issues abiertos en
  GitHub por ahora» (eso hace el código).
- **Campos que el código usa, verificados contra la API viva** en otro
  repo público con Issues reales (`octocat/Spoon-Knife`, 3 issues):
  `title`, `user.login`, `reactions.total_count`, `comments`, `html_url`
  y `pull_request` **existen en todos**. Además los 3 eran PRs, lo que
  confirma que el filtro `!x.pull_request` del código es necesario y
  correcto. **No hizo falta corregir el código.**
- **Desde el Chromium de esta VM tampoco hay salida a `api.github.com`**
  (igual que al agente del buzón: la suite previa §8 y mi suite §7
  reciben la nota «Sin conexión»). Por eso la ruta del fetch se verificó
  con **intercepción de ruta** en Playwright, devolviendo un payload con
  la forma exacta de la API viva (un Issue con 5 reacciones y 3
  comentarios + un PR): la app muestra el Issue real con
  «👍 5 reacciones · 💬 3 comentarios», filtra el PR y pone la nota
  «solo lectura». Mi suite §7: 4/4.
- **Caveat:** la lista real contra el repo de Wex no se pudo ver en el
  navegador en esta VM; la primera vez que Wex abra Ajustes con internet
  en su teléfono, la lista dirá «No hay Issues abiertos» (0 Issues hoy).
  En cuanto alguien abra un Issue, aparecerá solo.

## 4. Subida de versión a 0.8.1 (hecha por mí)

| Archivo | Cambio |
|---|---|
| `VERSION` | `0.8 beta` → `0.8.1 beta` |
| `CHANGELOG.md` | Entrada nueva «v0.8.1 beta — 2026-11-26» (6 puntos) |
| `README.md` | Título v0.8.1 + línea de buzón y Navidad |
| `index.html` | Pill «v0.8.1 beta» + párrafo «Nuevo en 0.8.1» en Acerca de |
| `assets/app.js` | Comentario de cabecera v0.8.1 (el cuerpo ya decía v0.8.1 en la URL de Issues) |
| `assets/biblioteca.json` | Regenerado con `tools/build_biblioteca.py` (valida 242, 0 errores): solo cambia `v` → «0.8.1 beta»; `cats` y `mols` **idénticos** a la v0.8 |
| `sw.js` | Caché `wex-molforge-v8` → `wex-molforge-v9`; `assets/navidad.js` ya estaba en `CORE` |

Líneas de código (mismo método que la v0.8): **2 085** (era 1 889;
index.html 226, app.css 229, elementos.js 3, chem.js 426, view.js 172,
liquid-glass.js 233, app.js 637, orbitals.js 89, navidad.js 40, sw.js 14,
servidor.py 16). El txt de presentación se corrigió de «1 900» a
«2 100» líneas.

## 5. Pruebas (corridas por mí, carpeta v0.8.1 servida en :8931)

- `node --check` en los 7 JS (`app.js`, `chem.js`, `elementos.js`,
  `liquid-glass.js`, `navidad.js`, `orbitals.js`, `view.js`): **todos OK**.
- E2E Navidad + buzón (`e2e-v081/test.mjs`, del agente anterior,
  recorrido de nuevo): **41/41 checks OK**, cero errores de página.
- E2E layout + escritorio (`e2e-v081/test-layout.mjs`, mío):
  **44/44 checks OK**, cero errores de página. Cubre: barra completa a
  390 y 360 px, las 5 pestañas, logro final bloqueado y desbloqueado,
  selector y datos de Orbitales, nota de hidrógeno en los dos estados,
  comunidad con payload real (mock) y nota offline, escritorio 1280 px,
  capturas finales.
- **Total: 85/85 checks, cero errores de página en todas las pasadas.**
- Capturas finales en `shots-v081/` (390 px, revisadas a ojo):
  `retos-390.png`, `retos-final-390.png` (tarjeta Logro final completa),
  `retos-bloqueado-390.png`, `orbitales-390.png`,
  `ajustes-buzon-390.png`, `ajustes-navidad-on-390.png`,
  `opciones-manual-on-390.png`, `buzon-votado-comentado-390.png`.

## 6. Zip

`Molforge-pro-v0.8.1-beta.zip`: contenido de la carpeta v0.8.1, sin
`._*`, `.DS_Store`, `__pycache__` ni `.pyc`. Dentro, en `docs/`, van el
txt de presentación actualizado y este informe (como en la v0.8).
Verificado extrayendo en `/tmp` y comparando archivo por archivo con la
carpeta: **idéntico** (ver §7).

## 7. Contenido del zip (verificación de extracción)

- Archivos en el zip: 45 (incluye `.nojekyll` y dotfiles de `.github/`).
- Comparación `diff -r` entre la extracción y la carpeta: sin diferencias.
- Tamaño del zip: 191 455 bytes (~187 KB).

## 8. Pendientes / caveats

- La lista real de la comunidad no se vio en un navegador con internet
  en esta VM (ver §3); en el teléfono de Wex dirá «No hay Issues
  abiertos» hasta que alguien abra el primero.
- La Navidad se quita en enero borrando `assets/navidad.js`, su
  `<script>` en `index.html`, la clase `.xmas-tree` y el bloque
  «NAVIDAD» de `app.css` (así lo documenta el propio `navidad.js`).
- Lo que sigue (del pptx, sin hacer): estereoquímica, ChEMBL, logP más
  preciso.
