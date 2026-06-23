# Imágenes del sitio de Sabrina

Los archivos `hero-1.svg`, `hero-2.svg`, `hero-3.svg`, `event-1.svg` y `event-2.svg` son
**placeholders on-brand** ("FOTO DE MUESTRA"), no las fotos finales.

## Por qué hay placeholders

Las imágenes reales viven en el proyecto de Claude Design ("Sabrina Portfolio"). No se
pudieron descargar por código: la herramienta de lectura del conector de diseño corta los
archivos en 256 KiB, y cada foto supera ese tamaño, así que llegaban truncadas (se veía solo
la franja superior de la imagen). No es un problema del diseño ni del sitio: es el límite de
descarga del tool.

## Cómo cargar las reales (cualquiera de estas opciones)

1. Bajar las 5 imágenes desde claude.ai/design (proyecto "Sabrina Portfolio", carpeta
   `assets/`) y dejarlas acá con el mismo nombre base pero extensión real (`.png`/`.webp`).
   Después actualizar las URLs en `packages/cms-client/src/fixtures/sabrina.ts`
   (`/assets/hero-1.svg` -> `/assets/hero-1.png`, etc.).

2. La vía definitiva según el PRD: el contenido (incluidas las fotos) llega desde el CMS
   (colección `medios`). Cuando Payload esté arriba, `obtenerSitioSabrina()` traerá las URLs
   reales y estos placeholders dejan de usarse.

Las fotos de hero conviene que sean recortes (PNG con transparencia) para el efecto de figura
sobre el fondo aireado; las de eventos son fotos completas.
