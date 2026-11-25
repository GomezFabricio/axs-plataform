# Tests del CMS

**Tipo:** test
**Estado:** cerrado (2026-11-25). Falta subir la rama y ver la primera corrida del CI.
**Rama:** `feat/cms-tests`, desde `4c87e1a`. Sin subir.
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

- El supuesto de arranque se cumplió: Vitest y Payload corren bien en Node 26 (D10).
- La rama sale de `feat/cms-docker-e-imagenes`, porque los tests cubren la subida de imágenes y
  eso todavía no está en `develop`. Para fusionar esta rama, aquella tiene que entrar antes o
  junto con esta.

## Cierre

### Qué quedó

- **97 tests en 7 archivos**, en verde, en unos 6 segundos. Se corren con `pnpm test`.
- **Arnés** en `apps/cms/tests/soporte/`: base plantilla migrada, una base y una carpeta de
  medios por archivo de test, fábricas, peticiones a los handlers sin servidor y limpieza ante
  fallos, Ctrl-C y migraciones que fallan.
- **CI** en `.github/workflows/ci.yml`: typecheck, lint, tests y build del CMS; la auditoría en
  un job aparte que informa sin bloquear.
- **Test primero encendido** en `docs/auditoria/config.yaml`, con las reglas en `CLAUDE.md`.
- **ADR-004** con la estrategia de tests y `docs/arquitectura/overview.md` actualizado.

| Archivo | Tests | Qué prueba |
|---|---|---|
| `integracion/aislamiento.test.ts` | 53 | Aislamiento entre clientas, escrituras sin sesión, editora sin clienta, controles de la administradora, contenido del sitio |
| `integracion/usuarios.test.ts` | 12 | Alta de usuarios, cada defensa por separado, inicio de sesión |
| `integracion/medios.test.ts` | 13 | Formatos, tope de 10 MB, lectura pública, borrado de fotos en uso |
| `integracion/endpoint-sitio.test.ts` | 11 | Contrato, comparación con el contenido de referencia, imágenes, límite de peticiones, errores |
| `integracion/arnes.test.ts` | 4 | Que el propio arnés funcione |
| `unitarios/rateLimit.test.ts` | 3 | Límite de peticiones |
| `integracion/carga-inicial.test.ts` | 1 | Carga inicial y que repetirla no duplique |

### Qué se verificó

- Cada tarea tuvo su revisión independiente y, donde hizo falta, su ronda de arreglos.
- Cada test se vio fallar con su regla rota a mano y después se revirtió (D7, D14).
- La revisión final rompió 16 reglas del CMS sobre una copia; los huecos que mostró se cerraron
  en una tanda y se volvieron a verificar (D22).
- En local, en el orden del CI: instalación, typecheck, lint, tests y build del CMS en verde.
- Los únicos cambios en el código del CMS son D3 (`payload.config.ts`) y D4 (`Medios.ts`), sin
  efecto en desarrollo ni en producción.
- No apareció ningún defecto del CMS: no quedó ningún test marcado como fallo esperado.

### Qué no se pudo verificar

- **El workflow nunca corrió en GitHub.** Se ve recién al subir la rama. Ahí hay que mirar la
  primera corrida y marcar el job `verificacion` como requerido en la protección de ramas.

### Qué queda diferido

- **Vulnerabilidades de dependencias (D13).** 140 previas, 9 críticas, en `next` y `payload`.
  Va en un cambio aparte, `chore: actualizar dependencias`, antes del proyecto 2. Al cerrarlo,
  el job de auditoría pasa a bloquear.
- **Error interno sin atender al superar el tope de subida (D17).** Se puede provocar sin
  sesión. Falta comprobar su efecto con el servidor levantado; va con el cambio de dependencias.
- **Migración de bases con contenido (D23).** Lo tiene que cubrir el proyecto 3 antes de migrar.
- **Decisiones de permisos implícitas (D15).** Las fija el proyecto 2 con tests al empezar.
- **Build del sitio de Sabrina en CI (D8).** Va con el proyecto de publicación.
- **Tests del panel en el navegador y del frontend.** Fuera del alcance.
- **Comentario de cabecera incorrecto en `Usuarios.ts` (D18).** Se corrige en el proyecto 2.
- **Salida de los tests con ruido (D20).** Aviso de `pg` y registros de Payload.
- **Detalles menores del arnés, de los tests y del CI** que las revisiones dejaron anotados y
  no abren ningún hueco en lo que la suite protege. La lista completa está en `diferidos.md`.
