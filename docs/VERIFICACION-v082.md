# Verificación · WEX MolForge Pro v0.8.2 beta

Fecha: 26 de noviembre de 2026. Empaquetado final por el agente de
empaquetado (esta verificación es **propia**: se corrieron las pruebas de
nuevo sobre la carpeta `Molforge-pro-v0.8.2-beta/` ya con la versión 0.8.2;
lo que viene de los dos agentes anteriores se marca como tal).

## 1. El bug de los orbitales (la captura de Wex, 15:02)

### Lo que se veía
Pestaña Orbitales, «Orbital p» activo, variante «px» activa, y el visor
3D **vacío** (caja oscura sin forma). La tarjeta del elemento arriba
estaba cortada por el scroll («Electrones de valencia: 1»). La nieve
navideña sí se veía (los puntitos grises): la decoración estaba viva,
el visor no. Lo bueno que confirma la captura: **la barra inferior ya
se ve completa** (Biblioteca, Laboratorio, Retos, Orbitales, Ajustes) —
el arreglo de la v0.8.1 funcionó.

### Causa raíz (agente 1, verificada en el código)
Dos fallos encadenados en `assets/orbitals.js`:

1. **La variante «all» se usaba como índice.** Al cambiar de modo, la
   app dejaba la variante en `'all'` («Todos»). Pero el orbital **s**
   solo tiene una variante, y el código hacía
   `FN[mode][variant]` con `variant === 'all'`: `FN['s']['all']` no
   existe → `TypeError` al intentar leer `[0]` de `undefined`. Por eso
   el visor se vaciaba justo al tocar «Orbital s» (y al volver a «p»,
   porque el estado ya estaba roto).
2. **El ciclo de render moría para siempre.** El
   `requestAnimationFrame` que reprograma el siguiente cuadro estaba
   **después** del dibujo, así que cuando el dibujo lanzaba el error,
   el ciclo ya no se volvía a programar: el visor quedaba negro para
   siempre, aunque después se eligiera una variante válida. No era un
   problema de cámara ni de nube de puntos vacía: era el bucle roto.

### Arreglo (agente 1)
- En `assets/orbitals.js`: la variante `'all'` ahora se traduce a
  índice `0` cuando el orbital tiene una sola variante
  (`[variant === 'all' ? 0 : variant]`), y el dibujo va dentro de
  `try/catch` con el `requestAnimationFrame` **siempre** reprogramado
  al final de `frame()`, falle o no el cuadro (el error se registra
  una sola vez en consola como `[OrbView]`).
- En `assets/app.js`: el botón «Todos» ya no se renderiza cuando el
  modo solo tiene una variante (`vs.length > 1 ? … : ''`), y al entrar
  a un modo de una sola variante la variante se fija en `0`
  (`if (vs.length === 1) S.orbVar = 0`). Nunca más un lienzo vacío sin
  explicación: cada variante seleccionable muestra su forma.

### Verificado por mí (regresión del agente 1, recorrida de nuevo)
Suite `/tmp/e2e2/regress-orb.mjs`: **35/35 checks OK**, cero errores
de página. Reproduce la secuencia exacta de Wex en Cu (Z 29):
Capas 3D → Orbital s → Orbital p «Todos» → px, con forma visible en
cada paso (lit 9 888 / 21 023 / 11 012 / 13 415) y el ciclo de render
sigue girando tras s → p → px (lit 13 249 → 13 224). Barrido completo
elemento × modo × variante en 12 elementos (H, Li, C, Na, K, Cr, Fe,
Cu, La, Ce, Lu, U): **130/130 vistas con forma visible**, cero
errores en cada elemento. Escritorio 1280 px: Ce f «Todos» y variante
7 visibles, Cu p px visible.
- Mi pasada propia (§A y §D de `e2e-v082/final-v082.mjs`, ver §6):
  Cu p px, Cr d variante 3, Ce f variante 7 y H s visibles a 390 px;
  Ce f variante 7 visible a 1280 px. Capturas
  `shots-v082/final-orb-cu-p-390.png`, `final-orb-cr-d-390.png`,
  `final-orb-ce-f-390.png`, `final-orb-ce-f-1280.png` (revisada a ojo
  la de Ce f: la forma f_y(3x²−y²) se ve completa, con ejes x/y/z).

## 2. Qué se añadió

### Color de fondo al descargar en PNG (agente 2)
- Hoja Descargar: sección «Fondo de la imagen (PNG)» con **10
  muestras** (Transparente, Oscuro, Blanco, Negro, Azul, Verde, Rojo,
  Rosa, Morado, Dorado) + **color propio** (`input type=color`) +
  **vista previa** pequeña del PNG con el fondo elegido. El PNG
  exportado usa el fondo elegido (o transparencia). La elección se
  guarda en `wex-pngbg` y se recuerda al volver.
- **Verificado por mí (suite del agente 2, recorrida de nuevo):**
  41/41 checks — píxeles del PNG exportado verificados: azul
  `#1e3a8a` → (30,58,138,255), blanco → (255,255,255,255), rosa
  `#be185d` → (190,24,93,255), transparente → alfa 0; tocar la
  muestra rosa guarda `#be185d` y el PNG sale rosa; color propio
  `#14532d` se guarda; se descarga `agua.png`.
- Mi pasada propia (§B): muestra rosa guardada + vista previa
  generada. Captura `shots-v082/final-descarga-rosa-390.png`
  (revisada a ojo: muestra rosa seleccionada y vista previa rosa).

### Foto de perfil (agente 2)
- Ajustes → Mi perfil: botón «Poner foto de perfil» (abre la galería
  o la cámara en el móvil, `input type=file accept="image/*"`). La
  foto se **comprime en el dispositivo** (máx. 512 px, JPEG 0.85) y se
  guarda en `wex-profile` (localStorage); se ve como **avatar
  redondo** en el perfil y al compartir logros. Botones «Cambiar foto
  de perfil» y «Quitar foto». **Nunca sale del dispositivo** salvo al
  exportar los datos (y el diálogo de importar avisa si el respaldo
  trae foto). Estado vacío: se mantiene el avatar de inicial.
- **Verificado por mí (suite del agente 2, recorrida de nuevo):**
  41/41 checks — foto 800×600 puesta y comprimida a 512×384 JPEG
  (~8 KB), aparece al compartir, **persiste al recargar**, cambiar
  foto cambia el avatar, quitar foto vuelve a la inicial y no queda
  `photo` guardada.
- Mi pasada propia (§B): foto puesta ≤512 px y JPEG. Captura
  `shots-v082/final-perfil-navidad-390.png` (revisada a ojo: avatar
  redondo rojo en la tarjeta de perfil; el texto de la tarjeta queda
  tapado un momento por el aviso «Decoración navideña prendida», que
  desaparece solo).

### Más Navidad (agente 2)
- Guirnalda de **18 focos** en la parte superior, saludo
  «¡Felices fiestas!» en el encabezado, 🎄 en los títulos de las
  pestañas y **gorro de Santa en el logo** de la pantalla de carga.
  Mismo interruptor en Ajustes («Decoración navideña»): prendida por
  defecto solo en diciembre, la preferencia guardada (`wex-navidad`)
  manda siempre. Respeta `prefers-reduced-motion` (nieve oculta, focos
  sin parpadeo). Código aislado para quitarlo en enero (un archivo +
  un `<script>` + clases + bloque CSS).
- **Verificado por mí (suite del agente 2, recorrida de nuevo):**
  41/41 checks — apagada por defecto en noviembre, prende/apaga al
  instante (clase `xmas` + 24 copos + 18 focos + saludo + árbol),
  prendida por defecto con fecha simulada de diciembre,
  `reduced-motion` sin animación.
- Mi pasada propia (§B y §D): 24 copos + 18 focos a 390 px y 18 focos
  sin overflow a 1280 px. Capturas `final-perfil-navidad-390.png` y
  `final-navidad-1280.png`.

### Pulido visual (agente 2)
- Halo radial sutil en los 3 temas (Claro, Oscuro, Cristal) y tarjeta
  de perfil rediseñada alrededor de la foto.
- **Verificado por mí (suite del agente 2, recorrida de nuevo):**
  41/41 checks — los 3 temas aplican sin overflow a escritorio.

## 3. Sin regresiones (verificado por mí)

Suite del agente 2 (§4–§5, recorrida de nuevo) + mi pasada propia
(§C): barra inferior completa a 360 px (las 5 etiquetas sin corte,
derechos 73/144/214/285/356) y sin desbordamiento horizontal; logro
final bloqueado (0 XP) y desbloqueado (950 XP, texto entero, botón
presente); Orbitales Cu p px con forma visible (15 348 px no-fondo);
hidrógeno manual: «Mostrar hidrógenos» deshabilitado + nota; buzón:
publicar sugerencia local. Mi §C confirma además a 360 px el logro
final desbloqueado con texto entero («Logro final desbloqueado»).

## 4. Subida de versión a 0.8.2 (hecha por mí)

| Archivo | Cambio |
|---|---|
| `VERSION` | `0.8.1 beta` → `0.8.2 beta` |
| `CHANGELOG.md` | Entrada nueva «v0.8.2 beta — 2026-11-26» (5 puntos) |
| `README.md` | Título v0.8.2 + líneas de foto de perfil, color PNG, orbitales y Navidad |
| `index.html` | Pill «v0.8.2 beta» + párrafo «Nuevo en 0.8.2» en Acerca de |
| `assets/app.js` | Comentario de cabecera v0.8.2 + `sugIssueUrl` ahora dice «v0.8.2» |
| `assets/biblioteca.json` | Regenerado con `tools/build_biblioteca.py` (valida 242, 0 errores): solo cambia `v` → «0.8.2 beta»; `cats` y `mols` **idénticos** a la v0.8.1 |
| `sw.js` | Caché `wex-molforge-v9` → `wex-molforge-v10` |

Búsqueda final de «0.8.1» en el código y la interfaz: solo quedan
menciones de historial correctas (la entrada v0.8.1 del CHANGELOG, el
párrafo «Nuevo en 0.8.1» de Acerca de y el informe histórico
`docs/VERIFICACION-v081.md`). La copia del txt en `docs/` se actualizó
a la v0.8.2, como en la v0.8.1.

Líneas de código (mismo método que la v0.8.1): **2 208** (era 2 085;
index.html 232, app.css 265, elementos.js 3, chem.js 426, view.js 172,
liquid-glass.js 233, app.js 693, orbitals.js 89, navidad.js 65, sw.js
14, servidor.py 16). El txt de presentación dice ahora «2 208
líneas» (antes «Unas 2 100»).

## 5. Pruebas (corridas por mí, carpeta v0.8.2 servida en :8932)

- `node --check` en los 7 JS (`app.js`, `chem.js`, `elementos.js`,
  `liquid-glass.js`, `navidad.js`, `orbitals.js`, `view.js`): **todos OK**.
- E2E color PNG + foto + Navidad + regresiones
  (`e2e-v082/test.mjs`, del agente 2, recorrido de nuevo):
  **41/41 checks OK**, cero errores de página.
- E2E regresión de orbitales (`/tmp/e2e2/regress-orb.mjs`, del agente 1,
  recorrido de nuevo): **35/35 checks OK**, 130/130 vistas con forma
  visible, cero errores de página.
- E2E final propia (`e2e-v082/final-v082.mjs`, mía): **17/17 checks
  OK**, cero errores de página. Cubre: pill v0.8.2, orbitales Cu p px
  / Cr d / Ce f / H s a 390 px, Ce f a 1280 px, descarga rosa guardada
  + vista previa, perfil con foto ≤512 px JPEG, Navidad 24 copos +
  18 focos, barra y logro final a 360 px, Navidad a escritorio.
  (Nota: mi primera pasada dio 16/17 por un fallo de mi propia
  aserción — comparaba el valor guardado sin quitarle las comillas
  JSON —, no de la app; corregida la aserción, 17/17.)
- **Total: 93/93 checks, cero errores de página en todas las pasadas.**
- Capturas finales en `shots-v082/` (las mías llevan prefijo `final-`):
  `final-orb-cu-p-390.png`, `final-orb-cr-d-390.png`,
  `final-orb-ce-f-390.png`, `final-orb-ce-f-1280.png`,
  `final-descarga-rosa-390.png`, `final-perfil-navidad-390.png`,
  `final-retos-360.png`, `final-navidad-1280.png` (revisadas a ojo las
  tres principales, ver §1–§2).

## 6. Zip

`Molforge-pro-v0.8.2-beta.zip`: contenido de la carpeta v0.8.2, sin
`._*`, `.DS_Store`, `__pycache__` ni `.pyc`. Dentro, en `docs/`, van el
txt de presentación actualizado y este informe (como en la v0.8.1).
Verificado extrayendo en `/tmp` y comparando archivo por archivo con la
carpeta: **idéntico** (ver §7).

## 7. Contenido del zip (verificación de extracción)

- Archivos en el zip: 45 (52 entradas contando directorios; incluye
  `.nojekyll` y dotfiles de `.github/`).
- Comparación `diff -r` entre la extracción y la carpeta: sin diferencias.
- Tamaño del zip: ~197 KB.
- `VERSION` dentro del zip: `0.8.2 beta`.

## 8. Pendientes / caveats

- La lista real de la comunidad (GitHub Issues) no se volvió a probar
  en esta versión porque el buzón no cambió desde la v0.8.1, donde ya
  se verificó contra la API viva (0 Issues abiertos entonces).
- La Navidad se quita en enero borrando `assets/navidad.js`, su
  `<script>` en `index.html`, las clases `.xmas-tree` / `.xmas-greet`
  y el bloque «NAVIDAD» de `app.css` (así lo documenta el propio
  `navidad.js`).
- Lo que sigue (del pptx, sin hacer): estereoquímica, ChEMBL, logP más
  preciso.
