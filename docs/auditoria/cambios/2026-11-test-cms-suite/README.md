# Tests del CMS

**Tipo:** test
**Estado:** planificado (2026-11-25). Plan en `tareas.md`, decisiones en `decisiones.md`.
**Nivel de ceremonia:** Completo
**Estructural:** false
**Áreas afectadas:** `apps/cms/` (tests nuevos, configuración del runner, `package.json`),
`package.json` de la raíz, `.github/workflows/`, `docs/auditoria/config.yaml`

---

## Qué

Proyecto 1 de `docs/modelo-de-negocio.md`. El CMS no tiene tests ni runner instalado, y el repo
no tiene CI aunque el `CLAUDE.md` lo da por hecho. Este cambio agrega la suite de tests del CMS,
la corre en CI y enciende el TDD para los proyectos que siguen.

## Por qué

Los proyectos 2 y 3 reescriben lo más delicado del CMS: el sistema de roles pasa a perfiles y
permisos, y el global de Sabrina y su endpoint pasan a la biblioteca de secciones. Sin tests no
hay forma de saber si esos cambios rompen el aislamiento entre clientas o cambian lo que se ve
en el sitio de Sabrina.

## Alcance

**Entra:**

- **Aislamiento entre clientas.** Una editora no puede leer, editar ni borrar nada de otra
  clienta (usuarios, clientas, medios, contenido del sitio). Un anónimo solo ve lo público.
  Nadie se asigna un rol ni una clienta que no le corresponde.
- **Medios.** Formatos permitidos, tope de 10 MB y bloqueo al borrar una foto en uso.
- **Endpoint público `/api/sitios/sabrina`.** Lo que devuelve respeta el contrato
  `SitioSabrinaSchema`; rate limit; errores sin detalle interno.
- **Migraciones.** La base de test se arma corriéndolas, así que se prueban en cada corrida.
- **Límite de peticiones** (`rateLimit`): tests unitarios.
- **Alta de usuarios e inicio de sesión**, por la capa REST.
- **Carga inicial** de Sabrina: que funcione y que repetirla no duplique datos.
- **CI.** Workflow de GitHub Actions con typecheck, lint, tests, build del CMS y `pnpm audit`.
- **TDD.** Al cerrar, `implement.tdd: true` y el `test_runner` en `docs/auditoria/config.yaml`.

**No entra:**

- El panel de administración en el navegador (tests end to end). Cambia en los proyectos 2 y 3
  y se cubre ahí.
- El frontend de Sabrina.
- Cambios de comportamiento del CMS. Si un test destapa un defecto, se registra y se decide
  aparte. Las únicas dos modificaciones al código son para poder testear y no cambian nada en
  desarrollo ni en producción: `push` apagado en test (D3) y carpeta de medios configurable
  (D4).
- El build del sitio de Sabrina en CI (D8).

## Enfoques considerados

- **Integración contra un Postgres real, con Vitest** (elegido). Cada corrida crea una base
  descartable, corre las migraciones, ejecuta los tests con la API local de Payload y borra la
  base. Prueba lo que Payload deja pasar de verdad. Es más lento que un test unitario y necesita
  un Postgres disponible, en local y en CI.
- **Unitarios con simulaciones** (descartado). Rápidos y sin base, pero una simulación del
  control de acceso no demuestra que el control de acceso funcione.
- **Pruebas HTTP contra el contenedor Docker** (descartado como base). Es lo más parecido a
  producción, pero es lento y difícil de depurar. Puede sumarse más adelante como prueba de humo
  del deploy.

## Criterio para escribir los tests

Los tests describen comportamiento ("una editora de A no puede leer medios de B"), no la
implementación ("el rol es `tenant_editor`"). Así sobreviven al cambio de roles por perfiles del
proyecto 2 y sirven para comprobar que ese cambio no rompió nada.

## Riesgos y supuestos

- **Sin verificar:** que Vitest corra bien en Node 26. El CLI de Payload ya falló en esa versión
  (D8 de `2026-11-feat-cms-subida-imagenes`). La primera tarea es comprobarlo antes de escribir
  el resto. Si no corre, se evalúa otro runner antes de seguir.
- La rama sale de `feat/cms-docker-e-imagenes`, porque los tests cubren la subida de imágenes y
  eso todavía no está en `develop`.
