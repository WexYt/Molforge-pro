# Cómo colaborar en WEX MolForge Pro

Todo aporte es bienvenido. Hay dos caminos, sin instalar nada.

## Añadir moléculas (el aporte más fácil)
1. Abre `data/moleculas.txt` en GitHub y pulsa el lápiz ✏️ (GitHub crea tu copia automáticamente).
2. Agrega una línea por molécula: `Categoría|Nombre|SMILES|Fórmula|CID(opcional)`. El formato y las categorías están al inicio del archivo.
3. Pulsa **Commit changes → Propose changes → Create pull request**.
4. Un chequeo automático valida que la fórmula coincida con el SMILES. Si falla, te dice la línea exacta.
5. Cuando el dueño del repositorio lo aprueba, la biblioteca se reconstruye sola.

## Reportar errores o pedir moléculas
Abre un *Issue* y elige una plantilla.

## Cambios de diseño
Los temas viven en `assets/wex-v04.css` (variables de color por tema) y `assets/wex-v04.js` (selector de tema). Haz un *fork*, edita, y abre un *Pull Request* con una captura de pantalla.

## Reglas
- Licencia MIT: al aportar aceptas publicar tu aporte bajo esa licencia.
- No subas material con derechos de autor ni código de terceros sin licencia.
- Respeto y paciencia: es un proyecto personal abierto.
