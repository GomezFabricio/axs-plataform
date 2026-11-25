# Decisiones — Tests del CMS

**Cambio:** `2026-11-test-cms-suite`

Registro append-only. Cada entrada: fecha, qué se decidió y por qué.

---

## D1 — Vitest con tests de integración contra un Postgres real (2026-11-25)

Los tests usan la API local de Payload y los handlers reales contra una base Postgres. Se
descartaron los unitarios con simulaciones: una simulación del control de acceso no demuestra
que el control de acceso funcione. Detalle de los enfoques en el README.

## D2 — Una base descartable por archivo de test, clonada de una plantilla (2026-11-25)

Al empezar la corrida se crea una base plantilla y se le corren las migraciones una sola vez.
Cada archivo de test clona la plantilla (`CREATE DATABASE ... TEMPLATE ...`), trabaja sobre su
copia y la borra al terminar.

**Por qué:** el contenido del sitio es un global único, así que dos archivos que lo modifiquen
se pisarían si compartieran base. Con una base por archivo los tests pueden correr en paralelo y
ninguno depende del orden. Clonar una plantilla en Postgres tarda milisegundos; migrar una base
por archivo tardaría segundos.

## D3 — En test el esquema sale de las migraciones, no de `push` (2026-11-25)

`payload.config.ts` pasa de `push: NODE_ENV !== "production"` a apagar `push` también cuando
`NODE_ENV === "test"`. La plantilla se arma con `payload.db.migrate({ migrations })`, usando el
arreglo de `src/migrations/index.ts`.

**Por qué:** con `push` encendido el esquema lo generaría Payload a partir de la configuración y
las migraciones no se probarían nunca. Así, una migración rota o faltante rompe la suite. En
desarrollo y producción no cambia nada.

## D4 — La carpeta de medios se configura con `MEDIA_DIR` (2026-11-25)

`Medios.ts` pasa de `staticDir: "media"` a `staticDir: process.env["MEDIA_DIR"] ?? "media"`.
Los tests apuntan `MEDIA_DIR` a una carpeta temporal fuera del repo.

**Por qué:** sin esto, cada test que sube una foto la dejaría en `apps/cms/media`, mezclada con
las fotos reales de desarrollo. Sin la variable el comportamiento es el de hoy.

## D5 — Las peticiones HTTP se prueban llamando a los handlers, sin levantar servidor (2026-11-25)

Un helper importa los handlers de `src/app/(payload)/api/[...slug]/route.ts` y de
`src/app/api/sitios/sabrina/route.ts` y los llama con un `Request` armado a mano.

**Por qué:** hay reglas que solo se evalúan en la capa REST y no en la API local: el tope de
tamaño de archivo (`abortOnLimit`), el filtro de formatos y el alta de usuarios (el registro de
una colección de autenticación saltea `access.create`, ver el comentario de `Usuarios.ts`).
Llamar al handler prueba el mismo código que corre en producción sin el costo de un servidor.

## D6 — Los tests describen comportamiento; los roles solo se nombran en las fábricas (2026-11-25)

Ningún archivo de test menciona `super_admin` ni `tenant_editor`. Los usuarios se crean con
`crearEditora(clienta)` y `crearAdministradorAxs()`, definidas en `tests/soporte/fabricas.ts`.

**Por qué:** el proyecto 2 reemplaza los roles por perfiles y permisos. Si los roles viven en un
solo archivo, ese cambio toca las fábricas y los tests quedan igual, que es lo que permite
usarlos para comprobar que el cambio no rompió el aislamiento.

## D7 — Como el código ya existe, cada grupo de tests se valida rompiendo la regla (2026-11-25)

Estos tests se escriben sobre código que ya funciona, así que no hay un rojo natural antes del
verde. Para cada grupo, la tarea indica una regla del código que se rompe a mano, se confirma
que el test falla y se revierte.

**Por qué:** un test que nunca se vio fallar no demuestra nada. Es el reemplazo del paso rojo
del TDD para este proyecto. Desde el proyecto 2 se trabaja con test primero.

## D8 — El CI no construye el sitio de Sabrina (2026-11-25)

El workflow corre typecheck, lint, tests, build del CMS y `pnpm audit`. El build del sitio de
Sabrina queda afuera.

**Por qué:** ese build le pide el contenido a un CMS en marcha. Levantar el CMS con datos dentro
del CI es trabajo del proyecto 8 (publicación). Queda anotado como diferido.

## D9 — `aMedioDto` no se extrae del endpoint (2026-11-25)

La conversión de un medio al DTO se cubre con el test del endpoint, no con un test unitario.

**Por qué:** vive dentro de `route.ts`, y un archivo de ruta de Next no puede exportar otras
funciones. Extraerla es tocar código que el proyecto 3 va a reescribir.
