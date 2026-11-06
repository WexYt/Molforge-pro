# WEX MolForge Pro

Visor y editor molecular 3D por WEX Labs (MIT). Datos de PubChem (NIH) y RCSB PDB.

## Uso local
Abre `index.html` con doble clic, o mejor, con un servidor local:

    python3 -m http.server 8000   # y abre http://localhost:8000

## Publicar en GitHub Pages
1. Crea un repositorio y sube estos archivos.
2. Settings → Pages → Branch: `main` / `(root)` → Save.
3. Tu app quedará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

## Añadir moléculas
Edita `molecules.js` y agrega nombres (en inglés) que PubChem reconozca.

## Independencia total de CDNs (opcional)
Descarga 3Dmol, JSZip y Kekule a una carpeta `vendor/` y cambia las etiquetas `<script>`/`<link>` de `index.html` para apuntar allí.
