# WEX MolForge Pro · v0.5 beta
Laboratorio molecular 3D pensado para el celular (WEX Labs, licencia MIT). **Código abierto y editable** (HTML + JavaScript sin dependencias, sin compilar).

- **Crear desde cero:** coloca átomos, une enlaces simples, dobles o triples y arrastra los átomos para darle forma.
- **Reconoce la molécula sola:** muestra el nombre y los elementos que la forman (biblioteca local; con internet, también PubChem).
- **Biblioteca:** 226 compuestos con buscador (nombre, fórmula, categoría; tolera errores de escritura).
- **Buscar en PubChem** cualquier compuesto y **descargar** SDF, MOL, XYZ, JSON o PNG.
- **Tres temas:** Claro, Oscuro y Cristal líquido. **Funciona sin conexión** (se instala como app).

## Inicio rápido (menos de 5 minutos)
```
python3 servidor.py        # abre http://localhost:8000/
```
En el celular: abre la página publicada y usa «Instalar app» / «Agregar a pantalla de inicio». Ver `LEEME-OFFLINE.txt`.

## Estructura
```
index.html  sw.js  manifest.webmanifest  icon-*.png  favicon.svg
assets/   app.css · chem.js (química y geometría) · view.js (visor táctil) · app.js (interfaz) · biblioteca.json (generado)
data/     moleculas.txt  ← aquí se agregan moléculas
tools/    build_biblioteca.py  (valida y genera assets/biblioteca.json)
docs/     GUIA-REPOSITORIO.md · HANDOFF.md · ADR-002 (arquitectura)
.github/  validación automática y plantillas
```

## Colaborar
Lee `CONTRIBUTING.md`. Cambios al repositorio: `docs/GUIA-REPOSITORIO.md`. Historial: `CHANGELOG.md`.
Datos: PubChem (NIH, dominio público).
