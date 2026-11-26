# Verificación MolForge Pro v0.8 — app (zip v0.7-beta) contra el pptx

Fecha: 2026-11-26. Fuentes: `Molforge-pro-v0.7-beta/` (zip `Molforge-pro_0_p0u5.zip`),
`WEX-MolForge-Pro-presentacion_1_bcob.pptx` (texto en `pptx-texto.txt`),
`docs/ADR-003`, `docs/ADR-004-logp-hidrogeno-orbitales-perfil.md`,
`docs/ADR-004-logp-orbitales-perfil.md`, `docs/HANDOFF.md`.

## 1. Conteos reconciliados (regla: normalizar nombres, distintos + extra = total)

| Conteo | Filas totales | Distintos | Extra | Grupos duplicados | Veredicto |
|---|---|---|---|---|---|
| Compuestos en `assets/biblioteca.json` (`mols`) | 242 | 242 (nombres normalizados) | 0 | 0 | Cuadra. 226 normales + 16 desbloqueables |
| Por categoría (suma) | 242 | — | — | — | Esenciales 37, Inorgánicos 49, Aromáticos 25, Fármacos 22, Hidrocarburos 21, Aminoácidos 20, Neurotransmisores 12, Azúcares y lípidos 10, Naturales 8, Polímeros 8, Vitaminas 7, Nucleótidos 7, Desbloqueables 16 = **242** |
| Desbloqueables (campo `u`) | 16 | 16 | 0 | 0 | Uno por cada misión (16 ids de `MIS`) |
| `data/moleculas.txt` | 251 líneas | 242 nombres | 0 | 0 | 251 = 8 líneas de comentario `#` + 242 filas de datos + 1 línea vacía final. Conjunto de nombres **idéntico** al JSON |
| Validador `tools/build_biblioteca.py --validate` | — | — | — | — | **242 moléculas válidas, 0 con error** (SMILES ↔ fórmula comprobados) |
| Elementos (`assets/elementos.js`) | 118 | 118 | 0 | 0 | `E` y `ZORDER` con 118 |
| Reglas de fármaco (`add(...)` en `assets/chem.js`) | 7 | — | — | — | lipinski, veber, egan, muegge, lead, rule3, ghose. **El pptx dice 8: falta 1** |
| Retos (`MIS` en `assets/app.js`) | 16 | 16 | — | — | XP: 40+60+50+50+70+80+60+100+60+60+50+40+80+60+50+40 = **950** (suma verificada fila a fila) |
| Niveles | 7 nombres | — | — | — | Aprendiz, Explorador, Alquimista, Químico, Maestro, Arquitecto molecular, Leyenda. Fórmula actual `1+floor(xp/150)` → 950 XP = nivel 7 |
| Líneas de código (app real) | 1 498 | — | — | — | index.html 174, app.css 172, elementos.js 4, chem.js 235, view.js 173, liquid-glass.js 234, app.js 384, orbitals.js 90, sw.js 15, servidor.py 17. **"Unas 1 500" del pptx: correcto** (sin orbitals.js serían 1 408) |

Nota: un primer conteo de `moleculas.txt` con una normalización defectuosa dio 244
distintos; se descartó y se repitió con filtros limpios (solo filas de datos, sin
comentarios): 242 distintos + 0 extra = 242 filas. La aritmética cuadra.

## 2. Tabla de verificación: promesa del pptx → estado real → veredicto

| # | Promesa del pptx | Estado real en el código | Veredicto |
|---|---|---|---|
| S3 | 242 compuestos (226 + 16 por desbloquear) | `biblioteca.json`: 242, 0 duplicados, 16 con campo `u` | **Cumple** |
| S3 | Buscador + PubChem | Buscador con tolerancia a errores; PubChem con internet; fila "Buscar en PubChem" | **Cumple** |
| S3 | Historial con origen (creado/buscado) | `wex-hist`: fecha, hora y origen (`crea/mod/bib/pub/imp/mine`); PubChem se marca "Buscada" | **Cumple** |
| S5 | En "Datos": fórmula, masa, **logP** y reglas | Fórmula y masa sí. **logP no existe**: `chem.js` dice "Sin logP (no se calcula)"; las reglas no usan logP | **Parcial** |
| S5 | Compartir logros con un código | No existe. Solo Web Share al descargar SDF | **Falta** |
| S6 | 118 elementos | 118 en `elementos.js` | **Cumple** |
| S6 | 242 compuestos | 242 | **Cumple** |
| S6 | **8 reglas de fármaco con logP** | **7 reglas y ninguna usa logP** (6 notas dicen "Sin logP") | **Falta** |
| S6 | 3 temas | Claro, Oscuro, Cristal | **Cumple** |
| S6 | 0 conexión necesaria | PWA con Service Worker; biblioteca local | **Cumple** |
| S6 | Perfil para compartir logros y paso de datos entre dispositivos | No existe sección de perfil en Ajustes. Solo respaldo de "Mis moléculas" | **Falta** |
| S7 | Al completar los 16 retos (950 XP, nivel 7) se desbloquea la vista de capas y orbitales | **No existe ninguna puerta ni vista**: `orbitals.js` NO se carga en `index.html`, no hay pestaña, botón ni condición de desbloqueo en `app.js` | **Roto** |
| S7 | Capas de electrones animadas para los 118 elementos | `orbitals.js` completo (Aufbau con excepciones, `shells()`, `OrbView` en canvas) pero sin cargar ni usar | **Falta (cableado)** |
| S7 | Orbitales s, p, d y f con todas sus variantes | `FN`: s:1, p:3, d:5, f:7 (verificado en el archivo) | **Cumple (archivo)** / falta uso |
| S7 | Configuración electrónica y electrones de valencia | `configString()`, `valence()` existen en `orbitals.js`, sin uso | **Falta (cableado)** |
| S7 | Formas = armónicos esféricos reales (parte angular) | Sí, en `orbitals.js` (conjunto cúbico para f) | **Cumple (archivo)** |
| S9 | JavaScript puro, sin compilar ni dependencias | Sí para la app que se ejecuta. El zip trae ~700 KB de archivos huérfanos del bundle viejo de Netlify/Vite que no se cargan (ver §4) | **Cumple** |
| S9 | Canvas 2D, visor 3D propio | `view.js` | **Cumple** |
| S9 | HTML+CSS responsivo | Sí (móvil, tableta, escritorio) | **Cumple** |
| S9 | Python genera biblioteca y tabla periódica | `tools/build_biblioteca.py`, `tools/build_elementos.py`; CI valida y regenera | **Cumple** |
| S9 | Service Worker (PWA) | `sw.js` (versión `wex-molforge-v6`) | **Cumple** |
| S9 | GitHub Pages + Actions | Workflow `biblioteca.yml` | **Cumple** |
| S9 | chem.js · view.js · app.js; ~1 500 líneas; MIT | Sí; 1 498 líneas contadas; MIT | **Cumple** |
| S10 | Alcance hoy: educación, cualquier celular sin internet, GitHub | Sí | **Cumple** |
| S10 | "Límites actuales: el logP es una estimación y todavía no hay estereoquímica" | Cierto, pero el límite es mayor: **el logP ni siquiera se calcula aún** | **Parcial** |
| S11 | Diálogo "No quiero que sea una sola aplicación de química" | Texto de presentación, no función de la app; se incluye en el txt | N/A |
| S12 | Enlaces wexyt.github.io/Molforge-pro, GitHub, MIT, PubChem | En el pptx y en README/CONTRIBUTING | **Cumple** |
| — | Hidrógeno manual (que no se agregue solo) | No existe: los H siempre se completan solos por valencia (`chem.js`: "no se editan") | **Falta** |
| — | Logos/emblemas de niveles con animaciones | No existen: solo el nombre del nivel y un cuadro con el número | **Falta** |
| — | Animación visible al completar reto/subir de nivel (~2 s) | Toast de 2,8 s que se sobrescribe si hay varios; `.mis.pop` dura 0,9 s; el aviso de nivel es un toast con 1,2 s de retraso | **Parcial (corto)** |
| — | `VERSION` del zip dice 0.6 beta (carpeta v0.7-beta) | El zip es la foto del 2026-11-23, antes de la corrección; el repo ya quedó en 0.7 beta el 2026-11-25 | Se corrige en v0.8 |

## 3. El problema de retos/XP: qué se encontró de verdad

Wex dice: "completé las 16 pero no tengo suficiente XP". Revisado el código:

- **La suma es correcta**: las 16 misiones suman 950 XP (verificado fila a fila) y la
  fórmula de nivel `1+floor(xp/150)` da nivel 7 con 950 XP. **No hay bug aritmético
  en las misiones ni en la fórmula.**
- **El defecto real es que el desbloqueo final no existe**: no hay puerta, ni vista,
  ni pestaña de orbitales. Completar las 16 no muestra nada nuevo en la app, así que
  desde el punto de vista de Wex "no alcanza" para nada.
- **No hay reparación de XP**: si una partida guardada tiene misiones marcadas como
  hechas pero el XP quedó por debajo (por ejemplo, misiones hechas en una versión
  anterior, o un guardado parcial), nada lo recalcula. `P.xp` se suma misión a
  misión y nunca se vuelve a comprobar contra `P.done`.
- **Bonus no documentado**: cada descubrimiento suma +15 XP (`discover()`), así que el
  XP real puede pasar de 950. No es un bug, pero el medidor de nivel decía "XP para
  el nivel 8" aunque solo hay 7 niveles (defecto cosmético).
- **Corrección aplicada en v0.8** (según ADR-004): umbrales fijos de nivel
  `[0, 100, 250, 420, 620, 800, 950]` (nivel 7 = 950 XP exactos); reparación al
  cargar que fija `xp ≥ suma de retos hechos + 15 por descubrimiento`; puerta del
  logro final explícita: 16 retos hechos **o** 950 XP. Con eso, 16 retos = 950 XP =
  nivel 7 = orbitales desbloqueados, y las partidas guardadas se reparan solas.

## 4. Basura y archivos muertos en el zip v0.7 (no se cargan, verificados con grep)

- Basura de macOS: `._*` (24 archivos), `.DS_Store`, `__pycache__/*.pyc`.
- **App vieja v0.5 en la raíz**: `app.js` (15 KB, otra app distinta con router por
  hash) y `styles.css` (11 KB). `index.html` carga `assets/app.js`, no estos.
- **Restos del bundle compilado de Netlify/Vite en `assets/`** (~660 KB):
  `index-BZHH0yOC.js` (469 KB), `fixtures-D22f8Dkt.js` (101 KB),
  `index-DYEe31r0.css` (68 KB), `forja-D0LGHw2t.js` (28 KB),
  `routes-DqBNg-0I.js` (13 KB), `biblioteca-DOUZmxgT.js` (6 KB),
  `wex-v04.css` (6 KB), `wex-v04.js` (2 KB), `download-DCwZp7t2.js`,
  `external-link-D4hPHO-D.js`, `arrow-right-CuuoCWW3.js` (todos vacíos o casi).
- `data/fixtures-original.js` (45 KB, datos de la app vieja).
- Ninguno es referenciado por `index.html`, `sw.js`, `manifest.webmanifest` ni por
  ningún archivo JS/CSS real de la app. **Se eliminan del zip v0.8** (la carpeta
  v0.7 queda intacta como referencia).

## 5. Lo que no se pudo cumplir del pptx (con motivo)

- **Estereoquímica**: el pptx la pone como "siguiente paso" (S10), no como promesa
  de hoy. No se implementa en v0.8: el motor no guarda quiralidad y sería un cambio
  mayor. Sigue como pendiente.
- **ChEMBL**: también es "siguiente paso" (S10). No se implementa: necesita red y
  una integración nueva. Sigue como pendiente.
- **logP más preciso**: el pptx lo pone como "siguiente". En v0.8 se implementa
  Moriguchi (MLOGP) como estimación documentada, que es lo que pide el ADR-004.
  El propio pptx dice que el logP es una estimación.
- **Compartir logros "con un código"**: se implementa sin servidor (código
  `WEX1.…` con los datos en base64url + `nombre#CÓDIGO` generado en el
  dispositivo). Sin servidor no se puede garantizar que dos personas no elijan el
  mismo nombre; el código es informativo, no una prueba (ver ADR-004).

## 6. Decisiones de implementación para v0.8

- **logP por Moriguchi (MLOGP)**, fórmula cerrada de 13 descriptores
  (Moriguchi et al., Chem. Pharm. Bull. 1992, 40, 127–130; 1994, 42, 976–978):
  `logP = -1,041 + 1,244·CX^0,6 − 1,017·NO^0,9 + 0,406·PRX − 0,145·UB^0,8
  + 0,511·HB + 0,268·POL − 2,215·AMP + 0,912·ALK − 0,392·RNG − 3,684·QN
  + 0,474·NO2 + 1,582·NCS + 0,773·BLM`.
  Se descartó Wildman-Crippen/XLogP (necesita tablas de decenas de tipos de átomo
  que no se pueden verificar sin red), como dice el ADR-004. Se muestra como
  estimación. Validación en §7 (valores de referencia en `/tmp/test-logp-v08.js`).
- **8ª regla: Pfizer 3/75** (logP > 3 y TPSA < 75 → mayor riesgo de toxicidad in
  vivo). Es una regla real y publicada, usa el logP nuevo y la TPSA que ya se
  calcula, y no necesita datos nuevos. Con ella las reglas son 8 como dice el pptx.
  Criterios logP añadidos: Lipinski logP ≤ 5; Egan logP ≤ 5,88; Muegge
  −2 ≤ logP ≤ 5; Ghose −0,4 ≤ logP ≤ 5,6; Oprea (cabeza de serie) logP ≤ 4,5;
  regla de 3 logP ≤ 3.
- **Hidrógeno manual** según ADR-004: bandera global en `chem.js` (`setAutoH`),
  conversión implícito→átomos (`explicitize`) y átomos→implícitos (`collapseH`).
  Implementado con H totales (`hTot` = H reales unidos + H implícitos por
  valencia) sobre la molécula tal como está: en modo manual la fórmula, la masa
  y el reconocimiento reflejan solo lo dibujado (un O solo es "O", no "H2O");
  con los H añadidos a mano, fórmula, canon, logP, SMILES y reglas son
  idénticos al modo automático (verificado en §7). Al activar el modo, la
  molécula actual convierte sus H implícitos en átomos reales para no perderla;
  al desactivarlo, vuelven a ser implícitos.
- **Perfil sin servidor** según ADR-004: usuario + código aleatorio de 6 caracteres
  generado en el dispositivo; logros como código `WEX1.`; datos completos en JSON
  con combinar/reemplazar.
- **Niveles con umbrales fijos** del ADR-004: `[0, 100, 250, 420, 620, 800, 950]`.

## 7. Implementación y pruebas de v0.8 (2026-11-26)

### 7.1 Qué cambió

| Archivo | Cambio |
|---|---|
| `assets/chem.js` | logP Moriguchi (13 descriptores, ciclos hasta 7, ALK por cadena acíclica); 8ª regla Pfizer 3/75 + criterios logP en Lipinski/Egan/Muegge/Ghose/Oprea/regla de 3 (y corrección: Lipinski usaba rot ≤ 10 en vez de logP ≤ 5); `descr()` devuelve `logp`/`logpDesc`/`logpApprox`; modo hidrógeno manual (`setAutoH`, `explicitize`, `collapseH`, `hTot`); `canon`/`toSmiles`/`tpsa`/`descr`/`logp` usan H totales y son idénticos en ambos modos |
| `assets/app.js` | Umbrales fijos de nivel `[0,100,250,420,620,800,950]`; `repairXP()` al arrancar; puerta del logro final (`finalUnlocked()`); 7 emblemas SVG de nivel + celebración en cola visible ~2,6 s; `.mis.pop` 0,9 s → 2 s; medidor sin "nivel 8"; perfil en Ajustes (nombre + código de 6, compartir logros `WEX1.`, ver logros de un código, exportar/importar todos los datos con fusionar/reemplazar); interruptor de hidrógeno manual; pestaña Orbitales (`renderOrbitales`, `OrbView`, modos Capas/s/p/d/f con variantes); tile logP en Datos; nota corregida en la hoja de datos |
| `assets/orbitals.js` | Sin cambios (ya estaba completo; ahora se carga) |
| `assets/app.css` | Estilos de emblema, celebración, tarjeta de logro final, Orbitales y perfil; `prefers-reduced-motion` respetado |
| `index.html` | Pestaña Orbitales + botón en la barra + icono `#i-orb`; sección Mi perfil; interruptor de hidrógeno manual; `<script src="assets/orbitals.js">`; `#celebrate`; `#file-profile`; pill y Acerca de en 0.8 beta |
| `sw.js` | Versión `wex-molforge-v8`; `assets/orbitals.js` en CORE |
| `VERSION`, `assets/biblioteca.json` | `0.8 beta` (JSON regenerado con `tools/build_biblioteca.py`: 242 moléculas válidas, 0 con error) |
| `CHANGELOG.md`, `README.md`, `docs/HANDOFF.md` | Entrada v0.8; README actualizado (8 reglas con logP, H manual, perfil, logro final); HANDOFF con órdenes v0.8 y estado actual |
| Eliminados del zip | `app.js` y `styles.css` de la raíz (v0.5), `data/fixtures-original.js`, 11 archivos del bundle Vite/Netlify en `assets/` (~700 KB). Zip v0.8: 464 KB (era 1,3 MB). Líneas de código de la app: 1 889 (index.html 205, app.css 184, elementos.js 3, chem.js 426, view.js 172, liquid-glass.js 233, app.js 547, orbitals.js 89, sw.js 14, servidor.py 16) |

### 7.2 logP validado contra valores experimentales (octanol/agua)

26 compuestos de la biblioteca con logP experimental publicado. Resultado:
**MAE 0,54 · RMSE 0,66 · error máximo 1,29** (ácido salicílico; el modelo lo
subestima, debilidad conocida de Moriguchi). Ejemplos: etanol −0,31 exp →
−0,17 calc; benceno 2,13 → 2,25; tolueno 2,73 → 2,61; aspirina 1,19 → 0,62;
cafeína −0,07 → −1,16; ibuprofeno 3,97 → 2,82; colesterol 6,82 → 7,30;
glucosa −3,24 → −2,48; hexano 3,90 → 3,52. 4 compuestos de la lista de
referencia no están en la biblioteca (1-octanol, cloroformo, hidrocortisona,
vanilina). La cadena ALK se mide solo por enlaces acíclicos C–C (el contorno
de un anillo no es una cadena): así mejora el MAE global (0,58 → 0,54) aunque
ibuprofeno y naproxeno empeoren por separado. El logP se muestra como
estimación en la app y en el txt de presentación.

### 7.3 Hidrógeno manual verificado (node)

- Agua en auto: H2O; en manual sin H dibujados: O; `explicitize` da O+H+H con
  enlaces y vuelve a H2O; `collapseH` vuelve a O.
- Etanol manual con H explícitos: fórmula C2H6O, canon, logP (−0,17) y SMILES
  (CCO) idénticos al modo automático; reglas iguales. Sin H dibujados es C2O
  y no se reconoce (correcto: no está completa).
- `node --check` pasa en los 7 JS de la app + `sw.js`.

### 7.4 Pruebas E2E en Chromium headless (Playwright, `/tmp/e2e-v08.js`)

**28/28 pasan.** Escritorio (1280×800) y móvil (390×844, táctil):

- Biblioteca: 226 compuestos + 16 por desbloquear; pill v0.8 beta.
- Aspirina abierta: tile logP 0,62 visible; 8 reglas con Pfizer 3/75.
- Perfil: nombre y código `#XXXXXX` generados; código `WEX1.…` generado y
  decodificado correctamente (ver logros muestra nombre, XP, nivel, retos).
- H manual en la app: agua H2O → al activar, la molécula se conserva con H
  reales → O solo en manual es "O" → al desactivar, H2O.
- Celebración visible y se oculta sola a los ~2,6 s.
- Partida guardada rota (16 retos hechos, 0 XP): al cargar, **XP reparado a
  950**; nivel 7; "Nivel máximo · 950 XP" (sin "nivel 8"); emblema presente;
  logro final desbloqueado; pestaña Orbitales con capas de Fe ([Ar] 3d⁶ 4s²,
  capas 2·8·14·2, valencia 2); orbital d con 6 botones (Todos + 5 variantes);
  oxígeno [He] 2s² 2p⁴; orbital p con 4 botones (Todos + 3); canvas con tamaño.
- Móvil: lista con compuestos; Orbitales bloqueado sin progreso.
- Consola: cero errores de página. Solo dos avisos de `navigator.vibrate`
  bloqueado por falta de gesto del usuario en el navegador sin interfaz
  (en uso real el usuario ya tocó la pantalla; no es un error de la app).

### 7.5 Qué quedó pendiente (sin cambiar)

- Estereoquímica, ChEMBL y logP más preciso: siguen como "siguiente paso" del
  pptx (ver §5). No se prometen en el txt como hechos.
- Probar en iPhone/Safari reales (la app se probó en Chromium headless).
- No se subió nada a GitHub: el conector es solo lectura (403). El zip v0.8
  queda listo para subir por el navegador cuando Wex lo pida.
