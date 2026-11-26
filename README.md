# WEX MolForge Pro · v0.6 beta
Laboratorio molecular 3D para celular, tableta y escritorio (WEX Labs, licencia MIT). **Código abierto y editable** (HTML + JavaScript sin dependencias ni compilación).

- **Laboratorio:** crea moléculas desde cero con enlaces simples, dobles y triples; arrastra los átomos para darles forma; la app reconoce sola el nombre y los elementos.
- **Tabla periódica completa:** 118 elementos, organizados por familias para no saturar la pantalla.
- **Biblioteca:** 226 compuestos + 16 desbloqueables, con buscador (nombre, fórmula, categoría) y búsqueda en PubChem.
- **Historial** con fecha y hora: distingue lo *creado* por ti, lo *modificado*, lo abierto de la *biblioteca* y lo *buscado en PubChem*.
- **Mis moléculas:** biblioteca del dispositivo (guardar, renombrar, importar SDF/MOL/JSON, respaldo).
- **Retos y desbloqueos:** niveles, 16 misiones y compuestos que se abren al cumplirlas.
- **Reglas de fármaco:** Lipinski, Veber, Egan, Muegge, Oprea, regla de 3 y Ghose (sin logP).
- **Tres temas:** Claro, Oscuro y Cristal líquido (con refracción real en Chromium). **Modo escritorio** de tres paneles. **Sin conexión** (app instalable).

## Inicio rápido
```
python3 servidor.py        # abre http://localhost:8000/
```
En el celular: abre la página publicada y usa «Instalar app» / «Agregar a pantalla de inicio» (ver `LEEME-OFFLINE.txt`).

## Estructura
```
index.html  sw.js  manifest.webmanifest  icon-*.png  favicon.svg
assets/   app.css · app.js (interfaz) · view.js (visor táctil) · chem.js (química y geometría)
          elementos.js (generado) · biblioteca.json (generado) · liquid-glass.js (terceros)
data/     moleculas.txt  ← aquí se agregan moléculas y desbloqueables
tools/    build_biblioteca.py · build_elementos.py
docs/     GUIA-REPOSITORIO.md · HANDOFF.md · ADR-002 · ADR-003 · liquid-glass-SKILL.md
.github/  validación automática y plantillas
```
Colaborar: `CONTRIBUTING.md`. Historial de versiones: `CHANGELOG.md`.

## Créditos
Datos: PubChem (NIH, dominio público). Efecto de vidrio líquido: `assets/liquid-glass.js`, técnica de aave.com y rizroze/liquid-glass, módulo de deepika-builds/liquid-glass; **revisa su licencia antes de redistribuir el repositorio públicamente**.
