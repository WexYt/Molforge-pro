# Historial de versiones

## v0.8.2 beta — 2026-11-26
- **Orbitales arreglados**: al tocar «Orbital s» (y al cambiar de variante) la app se rompía y el visor quedaba vacío para siempre. Causa: la variante «all» se usaba como índice en un orbital de una sola variante y el ciclo de render moría tras el error. Ahora cada variante seleccionable muestra su forma visible (1 s; 3 p; 5 d; 7 f) y el botón «Todos» se oculta cuando el modo solo tiene una variante.
- **Color de fondo al descargar en PNG** (hoja Descargar): 10 colores listos + transparente + color propio, con vista previa; el PNG exportado usa el fondo elegido y la elección se guarda en el dispositivo.
- **Foto de perfil** (Ajustes → Mi perfil): elige de la galería o la cámara; se comprime en el dispositivo (máx. 512 px, JPEG 0.85), se ve como avatar redondo en el perfil y al compartir, se puede cambiar o quitar, y nunca sale del dispositivo salvo al exportar tus datos.
- **Más Navidad** 🎄: guirnalda de 18 focos, saludo «¡Felices fiestas!», arbolito en los títulos y gorro de Santa en el logo; mismo interruptor en Ajustes, respeta `prefers-reduced-motion`, código aislado para quitarlo en enero.
- **Pulido visual**: halo radial sutil en los 3 temas (Claro, Oscuro, Cristal) y tarjeta de perfil rediseñada alrededor de la foto.

## v0.8.1 beta — 2026-11-26
- **Barra inferior corregida**: las 5 pestañas (Biblioteca, Laboratorio, Retos, Orbitales, Ajustes) ya se ven completas en teléfonos angostos (360–400 px): etiquetas e iconos más chicos y texto con puntos suspensivos en vez de cortarse.
- **Tarjeta de Logro final rehecha**: el texto ya no se corta a media palabra y el botón «Ver orbitales» va a ancho completo debajo del texto, en vez de apretarlo.
- **Selector de Orbitales y botones sin cortes**: el selector de elemento ya no se desborda y los botones de la fila de Retos tampoco.
- **Interruptor de hidrógenos coherente**: con hidrógeno manual prendido, «Mostrar hidrógenos» se ve apagado y deshabilitado, su descripción dice que no tiene efecto y la nota solo aparece cuando el modo manual está prendido de verdad.
- **Decoración navideña** 🎄: nieve ligera y un arbolito en el encabezado, con interruptor en Ajustes (prendida por defecto en diciembre, se puede apagar). Respeta `prefers-reduced-motion`. Código aislado para quitarlo en enero.
- **Buzón de sugerencias** (Ajustes): publica ideas que se guardan en el dispositivo y viajan con la exportación/importación de datos; vota con ⭐ (un voto por dispositivo, se quita tocando de nuevo), comenta para apoyar, comparte como texto o publícala en GitHub como Issue. La lista de la comunidad lee los Issues abiertos del repo (solo lectura, sin token) con sus reacciones y comentarios; sin internet muestra el buzón local con una nota clara. Sin servidor: los votos locales no se comparten.

## v0.8 beta
- **logP estimado (Moriguchi)**: visible en Datos junto a la fórmula y la masa, y usado como criterio en las reglas de fármaco. Es una estimación (error típico ~0.5 unidades), no un valor medido.
- **8.ª regla de fármaco: Pfizer 3/75** (logP > 3 y TPSA < 75 → mayor riesgo de toxicidad in vivo). Lipinski, Egan, Muegge y Ghose ahora también usan el logP.
- **Hidrógeno manual** (Ajustes): los H ya no se completan solos; se añaden a mano desde la paleta. Al activarlo, la molécula actual convierte sus H implícitos en átomos reales; al desactivarlo, vuelven a ser implícitos. Fórmula, masa, reconocimiento y reglas respetan el modo.
- **Mi perfil** (Ajustes): nombre y código único generados en el dispositivo, sin servidor. Compartir logros con un código `WEX1.…`, ver los logros de un código ajeno, y exportar/importar **todos** los datos (perfil, XP, retos, historial, moléculas guardadas) para pasarlos a otro dispositivo, fusionando o reemplazando.
- **Emblemas de nivel**: cada nivel tiene su logo (matraz, brújula, estrella, anillo, átomo, molécula, corona) con animación de entrada de ~2 s; al subir de nivel aparece una celebración grande que se ve ~2.6 s.
- **Retos y XP corregidos**: umbrales fijos de nivel (0, 100, 250, 420, 620, 800, 950 XP); el nivel 7 es exactamente 950 XP, la suma de los 16 retos. La barra de progreso ya no dice «nivel 8». Las partidas guardadas se reparan al abrir la app: el XP nunca queda por debajo de la suma de los retos cumplidos (+15 por descubrimiento).
- **Logro final: orbitales 3D**: al completar los 16 retos (o llegar a 950 XP) se desbloquea la pestaña Orbitales, con las capas de electrones en 3D (K, L, M, N…) y las formas s, p, d y f con todas sus variantes (1 s; 3 p; 5 d; 7 f), configuración electrónica, capas y electrones de valencia de los 118 elementos.

## v0.6 beta
- **Tabla periódica completa** (118 elementos) en el laboratorio, con familias y tabla emergente.
- **Historial** con fecha y hora y origen de cada molécula (creada, modificada, biblioteca o PubChem).
- **Mis moléculas** (biblioteca del dispositivo): guardar, renombrar, importar y respaldar.
- **Retos, niveles y 16 compuestos desbloqueables**; marca de «descubierta» al construir una molécula de la biblioteca.
- **Reglas de fármaco** (Lipinski, Veber, Egan, Muegge, Oprea, regla de 3, Ghose), TPSA aproximada y Fsp3.
- **Modo tableta y escritorio** (rail lateral, lista, laboratorio e inspector en vivo).
- **Vidrio líquido** real (liquid-glass.js) en el tema Cristal; acabados y detalles táctiles.

## v0.5 beta
- App reescrita como código abierto y editable (ya no depende del bundle compilado de Netlify).
- Móvil primero: tres secciones (Biblioteca, Laboratorio, Ajustes), gestos táctiles, hojas inferiores, vibración suave.
- Crear desde cero: átomos, enlaces simples/dobles/triples, arrastre elástico, deshacer/rehacer.
- La molécula se reconoce sola: nombre y elementos arriba (biblioteca local y PubChem con internet).
- Buscador sobre las 226 moléculas (tolera errores) y búsqueda en PubChem; descarga en SDF, MOL, XYZ, JSON y PNG.
- Pantalla de carga, animaciones sutiles, temas Claro, Oscuro y Cristal líquido.
- Geometría 3D calculada en el navegador (con planitud para anillos aromáticos).

## v0.4 beta
- Tres temas y entrada animada sobre la app anterior; biblioteca de 226 moléculas; modo sin conexión.

## v0.1
- Primera versión (Forja 3D, Biblioteca y Fuentes de datos).
