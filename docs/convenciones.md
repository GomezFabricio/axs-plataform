# Convenciones — Plataforma Axs

Estándar de nomenclatura y codificación del proyecto. Va al `CLAUDE.md`.

---

## Idioma

- **Dominio en español:** los nombres propios del negocio (secciones, clientas, mantenimientos, pagos) van en español.
- **Técnico/framework en inglés:** lo de las librerías queda como viene (`useState`, `fetch`, `props`, `map`, `render`). No se traduce.
- **Sin tildes ni ñ en identificadores** (base de datos y código), aunque la palabra los lleve: `descripcion`, `anio`, `contrasena`, `tamanio`. Evita líos de encoding. (En el contenido visible al usuario sí van las tildes; esto es solo para nombres de variables, columnas, etc.)

---

## Base de datos (PostgreSQL)

- **snake_case.**
- Tablas en **plural**: `clientas`, `secciones`, `tipos_seccion`.
- Columnas en snake_case: `clienta_id`, `actualizada_en`.
- Booleanos con prefijo: `esta_publicada`, `es_activa`.
- Claves foráneas: `<tabla_singular>_id` → `clienta_id`, `tipo_seccion_id`.
- Timestamps: `creada_en` / `actualizada_en` (tipo `timestamptz`).

---

## TypeScript

- **Variables y funciones:** `camelCase` en español → `obtenerSecciones`, `seccionActual`, `calcularMonto`.
- **Tipos, interfaces, componentes React, clases:** `PascalCase` en español → `Seccion`, `TipoSeccion`, `TarjetaServicio`.
- **Constantes:** `UPPER_SNAKE_CASE` → `MAX_SECCIONES`.
- **Archivos:** componentes en PascalCase (`TarjetaServicio.tsx`); utilidades en camelCase (`obtenerCliente.ts`).

---

## DTOs / JSON de la API

- Propiedades en **camelCase español** → `{ descripcion, foto, fechaCreacion }`.
- Validación con **Zod** en los endpoints custom (pagos, mantenimientos).

---

## Payload

- El **nombre de cada campo** en la config maneja la API y la columna. Nombrá los campos en **camelCase español**: así la API queda en camelCase (coincide con los DTOs) y el adaptador de Postgres genera las columnas en snake_case.
- Payload **autogenera los tipos TypeScript** del modelo: úsalos, no los reescribas a mano.

---

## Git

- Ramas: `main` (producción), `develop` (staging), y `feat/`, `fix/`, `chore/` (cortas, desde develop).
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`...
- **PRs con CI** (typecheck, lint, build, `pnpm audit`) antes de mergear. Sin push directo a main/develop.
- No hay rama por clienta: las clientas son apps en el monorepo (diseño) + datos en la base (contenido).

---

## Paquetes

- **pnpm** (nunca npm).
- **Versiones exactas pineadas** (sin `^`/`~`), lockfile commiteado.
- Revisar cada dependencia nueva antes de sumarla; correr `pnpm audit`.
