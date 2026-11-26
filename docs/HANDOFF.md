# Documento de traspaso · WEX MolForge Pro

Para cualquier persona o modelo de IA que continúe el trabajo **sin alterar las órdenes ni las ideas ya acordadas**. Idioma de trabajo y de la app: **español**.

## Órdenes y deseos del propietario (no cambiar)
1. Proyecto personal, **MIT**, gratis, **sin depender de Netlify**; se publica en GitHub Pages (repositorio `Molforge-pro`, sitio `https://wexyt.github.io/Molforge-pro/`).
2. **Pensado para celulares**: optimización y pequeños detalles sutiles son prioridad.
3. Crear moléculas **desde cero**: enlaces simples, dobles y triples; **arrastrar los átomos** para darles forma.
4. Al crear una molécula, **detectar sola el nombre y los elementos** que la forman, mostrados arriba.
5. Mantener las **226 moléculas** de la biblioteca; **buscador** para cualquier compuesto y **descarga**; sección de **creación desde cero**.
6. **Pantalla de carga**, animaciones y secciones mejoradas (no repetir la misma forma de página).
7. Tres temas: **Claro, Oscuro y Cristal líquido (Liquid Glass)**. **100 % sin conexión** (app instalable).
8. Otras personas pueden **colaborar subiendo aportes** al repositorio; el propietario aprueba.

## Órdenes añadidas en la v0.6 (no cambiar)
9. Historial de moléculas con fecha y hora; **avisar cuando una molécula fue buscada en PubChem** (no creada).
10. **Biblioteca del dispositivo** (moléculas guardadas) y un apartado para **desbloquear compuestos**.
11. **Tabla periódica completa** en el laboratorio, en secciones por familia, y **más reglas** como Lipinski.
12. **Modo escritorio/tableta** con las mismas funciones y más amplio, cuidando la estética.
13. Usar los activos de **liquid glass** que aportó el propietario (`assets/liquid-glass.js`, `docs/liquid-glass-SKILL.md`): solo en el tema Cristal, sin elementos de más de ~800 px por lado, y sin hacer que la refracción comunique información.

## Órdenes añadidas en la v0.8 (no cambiar)
14. **logP**: calcular el logP estimado (Moriguchi) y mostrarlo en Datos; usarlo en las reglas de fármaco (Lipinski, Egan, Muegge, Ghose) y añadir la 8.ª regla, Pfizer 3/75. Dejar claro que es una estimación.
15. **Hidrógeno manual**: un ajuste en Ajustes para que los H no se completen solos y se añadan a mano; la fórmula, la masa y el reconocimiento deben respetar el modo.
16. **Perfil en Ajustes**: usuario único (nombre + código generado en el dispositivo, sin servidor), compartir logros con un código y pasar **todos** los datos a otro dispositivo (exportar/importar, fusionando o reemplazando).
17. **Logos de niveles** con animaciones que se vean (~2 s) y celebración al subir de nivel.
18. **Retos y XP**: que completar los 16 retos dé exactamente el nivel máximo (950 XP = nivel 7, no hay nivel 8) y que las partidas guardadas se reparen si el XP quedó por debajo de lo que corresponde.
19. **Logro final**: al completar los 16 retos, desbloquear la vista 3D de las capas de electrones y los orbitales s, p, d y f con todas sus variantes.

## Estado actual (v0.8 beta)
- App en JS puro: `assets/chem.js` (modelo, fórmula, huella canónica, geometría, hidrógenos, logP Moriguchi, SDF/MOL/XYZ/SMILES), `assets/view.js` (canvas, gestos), `assets/orbitals.js` (capas de electrones y orbitales s/p/d/f), `assets/app.js` + `app.css` + `index.html`.
- Biblioteca: `data/moleculas.txt` → `tools/build_biblioteca.py` → `assets/biblioteca.json` (CI valida y regenera). 242 moléculas (226 + 16 desbloqueables).
- Probado con Chromium sin interfaz (Playwright): búsqueda, apertura, creación, arrastre, enlaces, deshacer, descarga SDF, temas, uso sin conexión, geometría de las 226 moléculas, logP contra valores experimentales (MAE 0.54 en 26 compuestos), modo hidrógeno manual, perfil exporta/importa, 16 retos = 950 XP = nivel 7 = orbitales desbloqueados.

## Decisiones de diseño
- Hidrógenos implícitos (valencia); solo los átomos pesados se editan. Reconocimiento: huella Weisfeiler-Lehman + PubChem (SMILES → CID → título) si hay internet.
- Gestos: un dedo gira o arrastra átomo; dos dedos hacen zoom y desplazamiento; herramientas Mover / Átomo / Enlace / Borrar.
- Pocas animaciones, con propósito (entrada de lista, aparición de átomos, cambio de tema circular); respetan «reducir movimiento».

## Pendientes conocidos
Probar en iPhone/Safari reales · verificar CID de PubChem escritos de memoria · ChEMBL · estereoquímica · probar el vidrio líquido en Safari/Firefox (usa respaldo esmerilado).

## Pendientes anteriores
ChEMBL · estereoquímica · importar MOL/SDF del dispositivo · verificar CID de PubChem escritos de memoria · pruebas en iPhone/Safari reales · compartir la vista como imagen con marca.

## Reglas para continuar
- No borrar ni cambiar lo acordado arriba; si algo debe cambiar, proponerlo al propietario primero.
- Cada cambio en `assets/` exige subir `wex-molforge-vN` en `sw.js`. Probar en móvil o con `python3 servidor.py`.
- Reglas de seguridad y derechos de autor: sin material con copyright ni explosivos/sustancias de abuso en la biblioteca.
