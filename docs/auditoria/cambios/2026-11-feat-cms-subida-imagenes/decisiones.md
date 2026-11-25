# Decisiones — Subida de imágenes del sitio desde el panel

**Cambio:** `2026-11-feat-cms-subida-imagenes`

> Registro append-only. Cada decisión: fecha (YYYY-MM-DD) + qué se decidió + por qué.

---

- **2026-11-23 — D1. Imágenes como campos upload a `medios`, no como texto.** Se reemplazan los
  grupos `imagen { url, textoAlternativo }` del global por un campo `upload` con `relationTo:
  "medios"`, definido una vez (`campoImagen`) y reusado en los 4 lugares. El texto alternativo
  vive en el medio. Razón: es lo que permite a la clienta subir y elegir fotos desde el panel sin
  escribir rutas. El contrato del DTO no cambia: el endpoint arma `{ url, textoAlternativo, ancho,
  alto }` con `aMedioDto()`, así el sitio no se entera.

- **2026-11-23 — D2. La migración vincula cada imagen al medio con el mismo nombre de archivo, y
  aborta si alguna queda sin vincular.** Migración escrita a mano
  (`20261123_000000_imagenes_upload.ts`): agrega las columnas `*_imagen_id` como nullable, las
  completa con `UPDATE ... FROM medios` comparando el nombre de archivo de la URL vieja, verifica
  que no quede ninguna en NULL (si queda, `RAISE` y la transacción se revierte), recién ahí pone
  `NOT NULL`, FKs e índices, y borra las columnas viejas. Razón: no perder contenido; fallar fuerte
  es mejor que dejar el sitio con imágenes vacías. Requisito: los medios tienen que estar subidos
  antes de migrar (el seed lo hace). `migrate:create` no corre en Node 26 (D8), por eso es manual;
  el snapshot `.json` se generó aparte.

- **2026-11-23 — D3. Lectura de `medios`: pública sin sesión, aislada por clienta con sesión.**
  `read: req.user ? accesoPorTenant : true`. Razón: los sitios y los navegadores de los visitantes
  tienen que poder cargar los archivos sin loguearse; en el panel cada editora ve solo los suyos.
  El field `clienta` se oculta a los anónimos (`read: Boolean(req.user)`).

- **2026-11-23 — D4. Formatos permitidos: JPG, PNG, WebP y AVIF. SVG no.** Razón: un SVG puede
  llevar scripts y se serviría desde el origen del CMS. Payload valida por contenido, así que un
  archivo con la extensión cambiada también se rechaza.

- **2026-11-23 — D5. Tope de 10 MB con `abortOnLimit: true`.** Razón: una foto de celular entra
  holgada. Sin `abortOnLimit`, Payload trunca el archivo en silencio y lo guarda corrupto con 201
  (lo encontró el verificador); con él, responde 413 y no guarda nada.

- **2026-11-23 — D6. No se puede borrar una foto en uso en el sitio.** Hook `beforeDelete` en
  `medios` que recorre el global buscando ese id y responde 400 con un mensaje para la clienta.
  Razón: Payload borra el archivo del disco antes de borrar la fila; la FK `NOT NULL` frenaba el
  borrado en la base, pero el archivo ya se había perdido y el sitio quedaba con la imagen rota.

- **2026-11-23 — D7. El selector de imagen solo acepta medios de la clienta dueña del sitio.**
  `filterOptions` en `campoImagen` filtra por la clienta con slug `sabrina` (helper
  `idClientaSabrina`, el mismo que usa el access del global). Payload lo aplica en el selector y
  lo valida al guardar. Razón: sin esto, la editora de Sabrina podía apuntar al medio de otra
  clienta conociendo su id (lo encontró el verificador). Efecto lateral bueno: un id inexistente
  da 400 en lugar de 500.

- **2026-11-23 — D8. Scripts de Payload en Node 26: bundle con esbuild.** `payload run`,
  `payload migrate` y `migrate:create` fallan en Node 26 con tsx 4.22.4
  (`node:crypto?tsx-namespace`). Para el seed y la migración de dev se empaquetó el script con el
  esbuild del workspace, se corrió con node y `NODE_ENV=production` (sin push), y se borró el
  bundle. `payload generate:types` sí funciona. La base de dev está gestionada por push (fila
  "dev" en `payload_migrations`), así que `up()` se aplicó directo dentro de una transacción, con
  backup previo. Queda como problema conocido para el deploy.
