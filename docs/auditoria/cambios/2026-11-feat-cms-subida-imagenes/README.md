# Subida de imágenes del sitio desde el panel

**Tipo:** feat
**Estado:** cerrado (revisión de gentle-ai pendiente, ver Cierre)
**Nivel de ceremonia:** Completo. Expediente registrado al cierre: el cambio se hizo antes de
retomar el formato forge en el repo.
**Estructural:** true (cambia el modelo de datos del global y columnas persistidas)
**Commit:** `eeba321` en `feat/cms-docker-e-imagenes`
**Áreas afectadas:** `apps/cms` (`payload.config.ts`, `src/collections/Medios.ts`,
`src/globals/SitioSabrina.ts`, `src/app/api/sitios/sabrina/route.ts`, `src/migrations/`,
`src/seed/sabrina.ts`, `src/payload-types.ts`), `packages/cms-client/src/fixtures/sabrina.ts`,
`docs/arquitectura/overview.md`

---

## Qué

Las imágenes del sitio (escenas del hero, Sobre mí, Pack y Experiencias) pasan de ser texto
(`url` + `alt` escritos a mano en el global `sitio-sabrina`) a campos upload que apuntan a la
colección `medios`. La clienta sube una foto nueva o elige una ya subida desde el panel, y el
endpoint `/api/sitios/sabrina` la devuelve con la misma forma del DTO (`{ url, textoAlternativo,
ancho, alto }`), ahora con ancho y alto reales.

## Por qué

El principio rector del proyecto es que la clienta edita su contenido sola. Con las imágenes como
texto, cambiar una foto exigía subir el archivo por fuera y escribir una ruta a mano: en la
práctica dependía de Axs. La colección `medios` ya existía desde Fase 1 pero no se usaba.

## Alcance

### Entra

- Campos upload en los 4 lugares con imagen del global, filtrados a los medios de la clienta dueña.
- `medios`: formatos JPG, PNG, WebP y AVIF hasta 10 MB; archivos públicos; aislamiento por clienta
  en el panel; bloqueo de borrado de una foto en uso.
- Migración que convierte el contenido existente sin perder datos, con `down()`.
- Seed que sube las imágenes de referencia como medios.
- Aplicación en la base de desarrollo y reconstrucción de los contenedores locales.

### Fuera de alcance

- Recorte, redimensionado o tamaños alternativos de imagen.
- Texto alternativo distinto por cada uso de la misma foto (hoy es uno por archivo).
- El modelo multi-tenant definitivo del global (deuda de Fase 3, D7 del hardening).
- Tests automatizados (no hay suite; TDD off).

## Cierre

**Resultado: CERRADO.** La clienta sube y elige fotos desde el panel y el sitio las muestra desde
el CMS. Verificado sobre bases descartables y en la base de desarrollo.

### Verificación

- Migración sobre base nueva: el esquema resultante es igual al de `push` (salvo orden de columnas
  y un default preexistente de `login_attempts`).
- Migración sobre un clon de la base de dev: textos, usuarios y clientas idénticos; imágenes
  vinculadas al medio correcto.
- Migración sin medios: aborta con mensaje claro y la base queda sin cambios.
- `down()` restaura las columnas de texto; el seed es idempotente.
- Base de dev: backup previo, 5 medios subidos, `up()` aplicado, contenido intacto. El sitio en
  `http://localhost:3002` carga las fotos desde `http://localhost:3001/api/medios/file/*`.

### Verificador independiente

Confirmó: subida de los 4 formatos, aislamiento entre clientas (ver, editar, borrar), rechazo de
SVG y de archivos disfrazados, bloqueo de borrado en uso, migración sin pérdida y reversible,
typecheck, lint y respuestas de error del endpoint sin cambios.

Encontró dos bloqueos, corregidos y re-verificados:

1. **Archivo de más de 10 MB guardado truncado** (respondía 201 con la imagen corrupta). Ahora 413
   sin guardar nada (D5).
2. **Foto de otra clienta aceptada en el sitio** si se conocía su id. Ahora 400; un id inexistente
   también da 400 en lugar de 500 (D7).

### Qué se difirió (advertencias, no bloquean)

- El listado anónimo de `medios` muestra nombre de archivo, texto alternativo y tamaño de todas
  las clientas. No dice de quién es cada uno, pero ordenando por `clienta` se pueden agrupar.
- Una foto usada en varios lugares comparte un solo texto alternativo.
- `down()` escribe URLs relativas (`/api/medios/file/...`).
- Un editor logueado de otra clienta recibe 403 al pedir el archivo de una foto ajena (el
  visitante anónimo sí la ve).
- La verificación de "foto en uso" solo mira el global `sitio-sabrina`; con más sitios hay que
  generalizarla.
- El adaptador de Postgres crea la base si no existe al conectar.
- `pnpm cms:seed` no corre en Node 26 por un bug de tsx (ver D8).

### Revisión de gentle-ai

Pendiente. La evaluación la marcó obligatoria (riesgo alto por migración y permisos), pero el
arranque pide declarar un archivo sin trackear de `.atl/` en un formato no documentado y rechazó
los tres intentos.
