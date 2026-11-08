# ADR-002: Reescribir WEX MolForge Pro como app móvil de código abierto

**Status:** Accepted · **Date:** 2026-11-07 · **Deciders:** WEX (propietario)

## Contexto
La app original solo existía como bundle compilado (React + TanStack): no se podían cambiar la Forja ni la Biblioteca. El propietario pidió: crear moléculas desde cero con enlaces simples/dobles/triples, reconocer nombre y elementos automáticamente, arrastrar átomos para darles forma, pantalla de carga, conservar las 226 moléculas, buscador con descarga, sección de creación, rediseño con animaciones, y optimizar para celulares. Debe seguir siendo gratis, offline y publicable en GitHub Pages.

## Decisión
Reescribir con **JavaScript sin dependencias ni paso de compilación** (3 archivos + CSS), canvas 2D propio para el visor 3D y datos en `assets/biblioteca.json` generado desde `data/moleculas.txt`.

## Opciones consideradas
| Opción | Complejidad | Control | Peso | Veredicto |
|---|---|---|---|---|
| A. Parchar el bundle compilado | Alta y frágil | Bajo | Grande | Descartada: no permite editar la Forja |
| B. Reescribir con React/Vite | Media | Alto | Medio | Descartada: añade compilación y dependencias para un uso personal |
| **C. JS puro + canvas** | Media | Total | ~130 KB | **Elegida** |

## Trade-offs
- Ganamos: código legible por cualquier colaborador, carga instantánea, offline sencillo, cero dependencias.
- Perdemos: la maquinaria de React (más trabajo manual en la interfaz) y WebGL (el canvas 2D basta para <100 átomos).
- Geometría: relajación elástica propia (enlaces, ángulos VSEPR, planitud sp2, repulsión). No es un campo de fuerzas completo ni modela estereoquímica.

## Consecuencias
- Los hidrógenos se derivan por valencia y no se editan; el reconocimiento usa una huella canónica (Weisfeiler-Lehman) y PubChem como respaldo en línea.
- La biblioteca se amplía editando un archivo de texto; la validación (SMILES contra fórmula) corre en GitHub Actions.
- Pendiente: integrar ChEMBL, verificar los CID de PubChem escritos de memoria, estereoquímica, importar archivos MOL/SDF del dispositivo.
