# Historial de versiones

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
