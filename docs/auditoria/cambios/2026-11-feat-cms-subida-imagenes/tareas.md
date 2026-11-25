# Tareas — Subida de imágenes del sitio desde el panel

**Cambio:** `2026-11-feat-cms-subida-imagenes`

> Checklist. TDD off: cada tarea se validó con typecheck + lint y verificación manual contra bases
> Postgres descartables; la aplicación en dev, con backup previo.

---

## Modelo y endpoint

- [x] **T1.** `campoImagen` (upload a `medios`) en hero.escenas, sobreMi, pack y
  experiencias.experiencias del global (D1).
- [x] **T2.** Endpoint: `aMedioDto()` convierte el medio poblado al DTO con ancho y alto.
- [x] **T3.** Regenerar `payload-types.ts`.

## Medios

- [x] **T4.** Formatos permitidos sin SVG (D4) y tope de 10 MB con `abortOnLimit` (D5).
- [x] **T5.** Lectura pública sin sesión, aislada con sesión; field `clienta` oculto a anónimos (D3).
- [x] **T6.** Hook `beforeDelete` que bloquea borrar una foto en uso (D6).
- [x] **T7.** `filterOptions` por clienta dueña en `campoImagen` (D7).

## Datos

- [x] **T8.** Migración `20261123_000000_imagenes_upload` con `up()`, `down()`, snapshot y registro
  en `index.ts` (D2).
- [x] **T9.** Seed: `asegurarMedio()` sube las imágenes de referencia como medios, idempotente.
- [x] **T10.** Verificar migración: base nueva igual a push, clon de dev sin pérdida, aborto sin
  medios, `down()`.
- [x] **T11.** Aplicar en la base de dev (backup en el scratchpad de la sesión, medios subidos,
  `up()` directo, D8) y reconstruir los contenedores locales.

## Cierre

- [x] **T12.** Actualizar `docs/arquitectura/overview.md` (filas de `medios` y del global).
- [x] **T13.** Verificación independiente y corrección de sus dos bloqueos (D5, D7).
- [x] **T14.** Commit `eeba321`.
- [ ] **T15.** Revisión de gentle-ai (bloqueada, ver Cierre del README).
