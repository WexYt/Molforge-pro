# Guía del repositorio · WEX MolForge Pro

## 1. Rutas importantes
| Qué | Dónde |
|---|---|
| Repositorio | `https://github.com/WexYt/Molforge-pro` |
| Sitio publicado | `https://wexyt.github.io/Molforge-pro/` |
| Moléculas (aquí se agregan) | `data/moleculas.txt` |
| Temas y animaciones | `assets/wex-v04.css` y `assets/wex-v04.js` |
| Biblioteca generada (no editar a mano) | `assets/fixtures-D22f8Dkt.js` |
| Versión | `VERSION` y `CHANGELOG.md` |
| Para colaboradores | `CONTRIBUTING.md` |

## 2. Cómo subes cambios tú
**Opción A · desde la web (sin instalar nada).** Add file → Upload files → arrastra los archivos → *Commit changes*. Para editar una molécula: abre `data/moleculas.txt` → ✏️ → *Commit changes*. En 1–2 minutos el sitio se actualiza.

**Opción B · con Git (recomendada si subes seguido).** Una sola vez:
```
git clone https://github.com/WexYt/Molforge-pro.git
cd Molforge-pro
```
Cada vez que quieras publicar:
```
git pull
(edita archivos)
python3 tools/build_biblioteca.py      # solo si tocaste data/moleculas.txt
git add .
git commit -m "Describe el cambio"
git push
```

## 3. Versiones
1. Cambia el texto de `VERSION` (p. ej. `0.5 beta`) y anota cambios en `CHANGELOG.md`.
2. Sube los cambios. El flujo automático actualiza la insignia de versión de la página.
3. En GitHub: *Releases → Create a new release*, etiqueta `v0.5-beta`. Así queda una copia descargable de cada versión.
Para forzar que quienes usan la app instalada reciban todo de inmediato, sube el número `wex-molforge-v2` de `sw.js` (p. ej. `v3`).

## 4. Cómo colaboran los demás
Pueden aportar sin permiso de escritura: *fork → cambio → Pull Request* (los pasos sencillos están en `CONTRIBUTING.md`). Tú decides qué se acepta.
Recomendado en **Settings → Branches → Add rule** para `main`: exigir Pull Request antes de unir. Así nadie publica sin tu aprobación. Si te da más trabajo del que quieres, puedes dejar la regla solo para colaboradores externos (que ya no tienen permiso de escritura por defecto).

## 5. Qué hace el flujo automático (`.github/workflows/biblioteca.yml`)
- En un Pull Request: revisa que cada molécula tenga fórmula y SMILES coherentes. Si no, marca la línea con error.
- Al unir a `main`: reconstruye `fixtures-*.js` y lo guarda solo.

## 6. Límites actuales (importante)
Solo tenemos el código **compilado** de la app. Se pueden agregar moléculas, temas y estilos, pero no cambiar la lógica de la Forja o la Biblioteca. Para eso se necesita el código fuente original (carpeta `src` y `package.json`); si lo consigues, se reorganiza el repositorio y se despliega con GitHub Actions.

## 7. Estructura
```
index.html  404.html  sw.js  manifest.webmanifest  icon-*.png  favicon.svg
assets/    app compilada + wex-v04.css/js + fixtures (biblioteca)
data/      moleculas.txt + fixtures-original.js (base sin modificar)
tools/     build_biblioteca.py
docs/      esta guía y las decisiones de arquitectura (ADR)
.github/   flujo automático y plantillas
```
