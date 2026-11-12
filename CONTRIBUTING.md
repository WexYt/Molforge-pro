# Cómo colaborar en WEX MolForge Pro

## Añadir moléculas (lo más fácil, sin instalar nada)
1. Abre `data/moleculas.txt` en GitHub y pulsa ✏️ (GitHub crea tu copia).
2. Agrega una línea por molécula: `Categoría|Nombre|SMILES|Fórmula|CID(opcional)`. El formato está al inicio del archivo.
   - SMILES en forma Kekulé: dobles enlaces explícitos en los anillos (`C1=CC=CC=C1`). Sin cargas ni estereoquímica.
3. **Commit changes → Propose changes → Create pull request.**
4. Un chequeo automático valida que la fórmula coincida con el SMILES y te dice la línea exacta si falla.
5. Al aprobarse, `assets/biblioteca.json` se regenera solo.

### Añadir un compuesto desbloqueable
Usa la categoría `Desbloqueables` y agrega al final el identificador del reto que lo abre (por ejemplo `|tabla-5`). Los retos están en `assets/app.js` (lista `MIS`).

## Cambiar la app
El código está en `assets/` (sin compilar):
- `chem.js`: modelo, fórmulas, reconocimiento, geometría, reglas de fármaco, formatos de archivo.
- `elementos.js` (generado con `python3 tools/build_elementos.py`): la tabla periódica.
- `view.js`: dibujo en canvas y gestos táctiles.
- `app.js` + `app.css` + `index.html`: interfaz y temas.

Haz un *fork*, prueba en un celular (o con `python3 servidor.py`), y abre un Pull Request con una captura de pantalla.
Si cambias archivos de `assets/`, sube el número de versión de caché en `sw.js` (`wex-molforge-vN`).

## Reglas
- Licencia MIT: al aportar aceptas publicar tu aporte bajo ella.
- No subas material con derechos de autor ni código de terceros sin licencia.
- Respeto y paciencia: es un proyecto personal abierto.
