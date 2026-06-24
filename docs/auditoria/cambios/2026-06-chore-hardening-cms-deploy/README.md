# Hardening del CMS y baseline de migraciones para deploy

**Tipo:** chore
**Estado:** cerrado
**Nivel de ceremonia:** (lo determina el orquestador tras este plan)
**Estructural:** false
**Áreas afectadas:** `apps/cms` (`payload.config.ts`, `src/migrations/`, `src/app/api/sitios/sabrina/route.ts`, `src/collections/Usuarios.ts`, `src/collections/Clientas.ts`, `src/collections/Medios.ts`, `src/globals/SitioSabrina.ts`, `src/lib/rateLimit.ts`, scripts de `package.json`)

---

## Qué

Primer incremento de **Fase 2**: endurecer el CMS (`apps/cms`) y dejarlo deployable. No agrega
features de dominio ni toca el contrato de datos. Cubre dos frentes que el review de Fase 1
(`2026-06-feat-cms-headless-sabrina`) dejó como deuda.

**1. Baseline de migraciones de producción.** Hoy `apps/cms/src/migrations/` está vacío y no hay
script `payload migrate` cableado. El adaptador ya alterna `push` por entorno
(`payload.config.ts:30`: `push: process.env["NODE_ENV"] !== "production"`), o sea push en dev y
sin push en prod, pero sin migraciones generadas el esquema no se crea ni se actualiza en
producción. Hay que generar la baseline de migraciones de Payload (`payload migrate:create`),
commitearla en `src/migrations/`, agregar los scripts de `migrate` al `package.json` del CMS, y
dejar el flujo listo para cablear en el deploy/CI. Este es el bloqueante que el dba-reviewer dejó
para poder deployar (deuda #1).

**2. Hardening de la deuda registrada** del review de Fase 1:

- **Fuga de internals en el 500.** El endpoint público `GET /api/sitios/sabrina`
  (`route.ts:258-260`) devuelve `detalle: error.message` en la respuesta del 500, lo que puede
  filtrar internals de infra (SQL, nombres de tablas, driver). Loguear el mensaje server-side y
  devolver una respuesta genérica sin el campo `detalle` (deuda #2).
- **Guard para `hero.escenas` vacío.** La validación 422 actual (`route.ts:32`) cubre solo
  `config`; el hero se rellena con `?? []` (`route.ts:147`), así que con escenas vacías el endpoint
  responde 200 y el `.parse()` del cliente lanza un ZodError no tipado (`SitioSabrinaSchema` exige
  `escenas.min(1)`) que `page.tsx` no captura. Chequear `escenas.length >= 1` junto a la validación
  de `config` y devolver 422 con mensaje claro (deuda #3).
- **Auto-elevación de rol.** Verificar si un `tenant_editor` puede modificar su propio campo `rol`
  a `super_admin` (`Usuarios.ts:21-29`). El `access.update` de la colección usa `accesoPorTenant`,
  que para un editor permite editar los docs de su clienta (incluido potencialmente el suyo propio)
  sin restringir qué campos toca. Si se confirma explotable, es privilege escalation: restringir el
  `access.update` del campo `rol` a `super_admin` a nivel de field (deuda #4).
- **Rate limiting del endpoint público.** `GET /api/sitios/sabrina` no tiene rate limiting; agregar
  uno (deuda #7).

## Por qué

Fase 1 cerró el CMS funcionando en **dev**, con la decisión explícita de diferir el deploy a
producción y un conjunto de issues de hardening a Fase 2. El `decisiones.md` y la tabla de "Deuda
registrada" del cambio previo lo dejan documentado: el CRITICAL del dba-reviewer (migraciones
inexistentes) **bloquea la promoción a producción**, no el cierre de Fase 1. Este incremento salda
esa deuda: sin la baseline de migraciones no se puede deployar el CMS, y los cuatro ítems de
hardening cierran exposiciones de seguridad y correctness conocidas antes de que el sistema reciba
tráfico real o usuarios cargados.

Es trabajo de endurecimiento y tooling de deploy sobre un módulo existente, no una feature nueva ni
un bug que falle hoy en producción, de ahí el tipo `chore`.

## Alcance

### Entra

- **Baseline de migraciones de Payload:** generar con `payload migrate:create`, commitear los
  archivos resultantes en `apps/cms/src/migrations/`, agregar los scripts `migrate` /
  `migrate:create` al `package.json` del CMS, y verificar que `push:false` (vía `NODE_ENV=production`)
  con migraciones aplicadas reproduce el esquema actual de dev. La verificación se hace contra el
  Postgres dev en Docker (`apps/cms/docker-compose.yml`, postgres:17.5).
- **Fix del 500 que filtra internals** (`route.ts`): loguear `error.message` server-side y quitar
  `detalle` de la respuesta pública.
- **Guard de `hero.escenas` vacío** (`route.ts`): validar `escenas.length >= 1` y responder 422,
  alineado con el contrato `escenas.min(1)` del cliente.
- **Restricción del campo `rol`** (`Usuarios.ts`): `access.update` a nivel field que solo permita a
  `super_admin` cambiar el rol, previa verificación del comportamiento real de Payload sobre
  self-update.
- **Rate limiting** del endpoint público `GET /api/sitios/sabrina`.

### Fuera de alcance

- **Cablear el deploy real** (Docker de la app, Coolify, dominios, SSL, correr `migrate` en el CI
  pipeline): este incremento deja el flujo de migraciones LISTO para cablear, pero la configuración
  del pipeline/infra de deploy es un incremento posterior.
- **Mantenimientos, suscripciones, pagos y webhook de MercadoPago** (Fase 2 de dominio): no entran.
- **Otras deudas registradas no listadas arriba:** seed sin transacción vs concurrencia (deuda #5),
  índices en FK `clienta` y confirmación del `UNIQUE` de `email` (deuda #6), credenciales de dev
  parametrizadas, casts manuales del global a `payload-types`, `process.exit(0)` del seed, Global
  singleton no multi-tenant (Fase 3). Quedan fuera salvo que el diseño los considere prerequisito
  directo de un ítem en alcance.
- **Cambios al contrato:** `SitioSabrinaSchema` no cambia; la firma de `obtenerSitioSabrina()` no
  cambia; el sitio `sites/influencers/sabrina` no se toca.

### Decisiones que `/fg-design` debe resolver (anotadas, no bloquean el plan)

- **Estrategia de rate limiting.** El sitio consume el endpoint desde un Server Component con
  `next: { revalidate: 60 }`, así que el tráfico real al CMS es bajo y cacheado. Tradeoff a
  resolver: (a) limiter in-memory sin dependencia nueva, simple pero no resiste múltiples
  instancias; (b) dependencia dedicada pineada exacta (sumar peso a la cadena de suministro, correr
  `pnpm audit`); (c) delegar el rate limiting a la capa de infra/reverse-proxy del deploy y no
  resolverlo en código. Elegir el alcance correcto para Fase 2 sin sobre-ingeniería.
- **Forma de la baseline de migraciones.** `payload migrate:create` sobre una base que hoy se
  construye con `push` genera la baseline; hay que decidir si la baseline parte de una base limpia o
  refleja el estado pusheado actual, y cómo se valida que el esquema migrado es idéntico al de dev.
  Edge case: el seed y los datos de dev no deben quedar atados a la migración (la migración es DDL,
  el seed es aparte).
- **Alcance del fix de access control del rol.** Confirmar primero si Payload permite la
  auto-elevación (el dba/security-reviewer lo marcó como "verificar", no como explotable
  confirmado). Si NO es explotable, el fix puede ser una guarda defensiva mínima; si SÍ lo es, es
  privilege escalation y exige el `access.update` a nivel field más una verificación de que no rompe
  el flujo legítimo de `super_admin` editando roles.

## Restricciones

- **Stack cerrado** (`CLAUDE.md`, PRD sección 8): Payload 3.x + PostgreSQL, Next 16 App Router,
  TypeScript estricto. No se cambia el stack.
- **No romper el contrato:** `SitioSabrinaSchema` (`packages/cms-client/src/esquemas.ts`) no cambia;
  la firma y el tipo de retorno de `obtenerSitioSabrina()` (`Promise<SitioSabrina>`) no cambian;
  `sites/influencers/sabrina` no se toca. Los fixes del endpoint solo afectan respuestas de error
  (500 → sin `detalle`, escenas vacías → 422); el 200 con contenido válido sigue produciendo el
  mismo DTO.
- **pnpm con `save-exact=true`:** versiones pineadas exactas (sin `^`/`~`), lockfile commiteado. Si
  el rate limiting suma una dependencia, pinearla exacta, justificarla y correr `pnpm audit`.
- **Nomenclatura del proyecto** (`docs/convenciones.md`): identificadores TS en inglés, dominio y
  contenido visible en español; DB en snake_case español sin tildes ni ñ. Anti-IA no aplica
  directamente (sin frontend visible en este incremento).
- **Idempotencia de las migraciones:** la baseline debe poder correrse sobre una base limpia y
  reproducir el esquema actual; verificar contra el Postgres dev en Docker antes de cerrar.
- **TDD off** (`docs/auditoria/config.yaml`): sin test runner. Validación de cierre que define
  `/fg-review`: typecheck + lint + build + `pnpm audit`. Para las migraciones se suma una
  verificación manual: aplicar la migración sobre una base limpia y confirmar que el esquema
  coincide con el de dev.

## Contexto del codebase (CodeGraph)

CodeGraph indexado y activo. Exploración con `mcp__codegraph__codegraph_explore` y
`mcp__codegraph__codegraph_node` sobre los archivos foco. Estado actual relevante:

- **`apps/cms/payload.config.ts:24-31`** — `postgresAdapter` con
  `push: process.env["NODE_ENV"] !== "production"`. El push ya está condicionado por entorno; el
  hueco es la **ausencia de migraciones** (`src/migrations/` vacío) y de scripts `migrate`. No
  depende de él ningún archivo indexado.
- **`apps/cms/src/app/api/sitios/sabrina/route.ts`** — `GET()` único export. La validación 422
  (línea 32) cubre solo `config`; el hero se rellena con `?? []` (línea 147) sin guard de longitud;
  el catch (líneas 257-262) devuelve `detalle: message`. El 200 arma el DTO completo (líneas
  135-254) con la forma exacta de `SitioSabrinaSchema`.
- **`apps/cms/src/collections/Usuarios.ts`** — `access.update: accesoPorTenant` a nivel colección;
  el campo `rol` (líneas 21-29) NO tiene `access` a nivel field. Usado por `payload.config.ts`.
- **`apps/cms/src/access/porTenant.ts`** — `accesoPorTenant`: `super_admin` ve/edita todo;
  `tenant_editor` queda restringido a `{ clienta: { equals: clientaId } }`, sin limitar qué campos
  modifica dentro de los docs accesibles. Es la base del riesgo de auto-elevación de `rol`.
- **Consumidor del contrato (blast radius):** `obtenerSitioSabrina()`
  (`packages/cms-client/src/cliente.ts`) hace `fetch(\`${baseUrl}/api/sitios/sabrina\`)` y
  `SitioSabrinaSchema.parse(...)`; lo usa `sites/influencers/sabrina/app/page.tsx`. Los fixes de
  error del endpoint no cambian la forma del 200, así que el consumidor no se ve afectado en el
  camino feliz. Sin tests que cubran estos símbolos (no hay suite).

## Alineación con la arquitectura

`docs/arquitectura/overview.md` y `stack.md` existen (derivados en `/fg-update-arch` tras Fase 1).
Este incremento es coherente con esa arquitectura: endurece el motor `apps/cms` sin alterar el flujo
documentado sitio → cms-client → endpoint → Payload → Postgres ni el contrato del DTO. Al no crear
módulos top-level ni cambiar dependencias mayores del stack, se marca **estructural: false** (una
dependencia menor para rate limiting, de sumarse, no reestructura la arquitectura). El detalle de
referencia del modelo de datos está en `docs/esquema.sql`; el PRD (`docs/PRD-DEFINITIVO-sabrina.md`)
enmarca el deploy y el hardening como Fase 2.

## Cierre

**Resultado del review: CERRADO.** El incremento dejó el CMS endurecido y deployable. Las migraciones
de producción quedaron verificadas de punta a punta, el endpoint público endurecido, y todo el modelo
de permisos del panel (colecciones, campos y el global del contenido) cerrado y verificado EN VIVO
contra el CMS corriendo. La revisión pasó por tres bloqueos sucesivos que fueron destapando huecos de
permisos de la misma familia; cada uno se cerró y se verificó hasta que la última revisión de
seguridad dio el visto bueno sin ningún issue crítico ni alto pendiente.

### Estado final de los huecos de permisos (todos verificados en vivo)

| Hueco | Estado |
|---|---|
| Sección "Clientas" sin permisos (CRUD cross-tenant) | CERRADO |
| Sección "Medios" sin permisos | CERRADO |
| Editor se reasigna de clienta al EDITAR su usuario (IDOR) | CERRADO |
| Editor crea un usuario y le asigna una clienta ajena (IDOR vía creación) | CERRADO (smoke en vivo: 403) |
| Asignar rol super admin al CREAR o EDITAR usuario | CERRADO |
| Medios con clienta ajena al subir | CERRADO (se fuerza la clienta propia) |
| Límite de solicitudes: memoria sin tope | CERRADO |
| Contenido del sitio (global) escribible por cualquier editor | CERRADO (solo super admin o el editor de la clienta dueña) |

### El arreglo final del global

El contenido del sitio de Sabrina vive en un "global" de Payload que antes no tenía permisos
definidos, así que cualquier editor logueado podía escribirlo (se verificó en vivo en la vuelta
anterior). El dev autorizó cerrarlo en este mismo incremento. Ahora el global solo lo pueden leer y
editar el super admin o el editor de la clienta dueña, resuelta por su identificador de texto
("sabrina") sin números fijos en el código. La revisión de seguridad lo confirmó probando las trece
ramas posibles contra los datos reales y con prueba en vivo: un editor de otra clienta queda denegado,
el flujo legítimo (super admin y el editor de Sabrina) sigue funcionando, y el endpoint público
`GET /api/sitios/sabrina` sigue respondiendo 200 sin verse afectado. Queda anotada para Fase 3 la
deuda de pasar a un modelo multi-tenant nativo (un global o colección por clienta), que es la forma
correcta cuando haya más de una clienta.

<!-- Bloque histórico de la decisión (se mantuvo para trazabilidad del ciclo):
Dos caminos válidos, el dev eligió (A):
- **(A) Cerrarlo ahora** en este incremento: agregar permisos de lectura/escritura al global
  (`apps/cms/src/globals/SitioSabrina.ts`), atados a la clienta dueña o a super admin. Mismo patrón
  que los arreglos ya aplicados. Implica un tercer reintento, que excede el tope de 2 del ciclo.
- **(B) Aceptarlo como deuda explícita** documentada para el incremento multi-tenant (Fase 3) y cerrar
  este cambio con la excepción registrada, ya que el alcance comprometido (permisos de colecciones y
  campos) está completo y el impacto presente es bajo.
-->

### Qué quedó hecho

- **Baseline de migraciones de producción, verificada de punta a punta.** Se generó la migración
  baseline del CMS y se probó de verdad: se aplicó sobre una base limpia en modo producción y el
  esquema resultante reproduce EXACTO el de desarrollo (las 22 tablas, los 2 enums, las 170
  columnas, las 20 relaciones y los 76 índices, todo idéntico). La migración trae solo la
  estructura de la base, sin datos de ejemplo: los datos siguen cargándose por separado. El CMS
  queda listo para crear y versionar su esquema en producción.
- **Fuga de información en el error 500: cerrada.** El endpoint público ya no devuelve detalles
  internos del servidor cuando algo falla; ahora responde un mensaje genérico y guarda el detalle
  solo en los logs del servidor.
- **Sitio incompleto: ahora avisa claro.** Si falta contenido obligatorio (escenas del hero), el
  endpoint responde con un error 422 entendible en vez de devolver un dato roto.
- **Límite de solicitudes (rate limit) en el endpoint público:** implementado, suficiente para esta
  fase (instancia única, tráfico bajo y cacheado), con sus limitaciones ya documentadas para
  revisar al montar el deploy real.
- **Modelo de permisos del panel, completo y verificado en vivo.** Las secciones Clientas, Medios y
  Usuarios, los campos sensibles (rol, clienta) y el global del contenido del sitio quedaron con
  permisos por clienta y por rol, sin que un editor pueda salir de su clienta ni elevarse a super
  admin (al editar, al crear, ni vía el contenido del sitio). Detalle de la matriz en `decisiones.md`
  D6/D7.

### Histórico de las vueltas (ya resuelto)

- **Primera vuelta:** bloqueó por cuatro huecos (Clientas/Medios sin permisos, campo "clienta" sin
  protección al editar, rol asignable al crear, rate limit con memoria sin tope).
- **Reintento 1:** cerró esos cuatro, pero destapó el IDOR vía creación de usuarios.
- **Reintento 2:** cerró el IDOR de creación con barrera doble (permiso de colección + hook que
  rechaza con 403), verificado en vivo. Al auditar exhaustivamente apareció el hueco del global.
- **Verificación final:** el dev autorizó cerrar el global; se aplicaron sus permisos y la revisión de
  seguridad dio el visto bueno (sin issues críticos ni altos). Cambio cerrado.

### Qué se difirió (deuda anotada, no bloquea)

- `down()` de la migración vacío: el "deshacer" de la baseline no revierte nada y lo da por exitoso;
  conviene que falle de forma explícita. No afecta el avance hacia producción.
- `Retry-After` del rate limit sin tope inferior (puede quedar en cero en el borde de la ventana). LOW.
- Limitaciones ya documentadas del rate limit in-memory: no resiste múltiples instancias y la IP es
  falsificable sin un proxy de confianza; se reemplaza al cablear el deploy real.
- Modelo multi-tenant nativo (un global o colección por clienta) para reemplazar el ownership del
  global resuelto hoy por slug: deuda de Fase 3 (D7). De paso, el chequeo de acceso del global resuelve
  la clienta dueña con una consulta por request (LOW de performance, intrascendente en Fase 2).
- Cablear el deploy real (Docker de la app, Coolify, dominios, SSL, correr `migrate` en el CI): este
  incremento deja el flujo de migraciones listo, la infra es un incremento posterior.
- **Higiene de la base de dev:** los smoke en vivo de los reintentos dejaron en `axs_cms` una clienta
  de prueba `FakeClienta` (slug `fake-clienta`) y un usuario editor de prueba con password reseteado.
  No afectan seguridad ni el flujo, pero conviene depurarlos a mano. /fg-review no toca datos de la
  base de dev compartida (acción destructiva que decide el dev).

### Resultado de los reviewers

Primera vuelta:

| Reviewer | Veredicto | Crit. | Alto | Otros |
|---|---|---|---|---|
| dba-reviewer | aprobado | 0 | 0 | 1 WARNING (`down()` vacío), 2 sugerencias |
| security-reviewer | bloqueante | 2 | 1 | 3 MEDIUM, 1 LOW |
| code-reviewer | con observaciones | 0 | 0 | 1 WARNING (`Retry-After`), 4 sugerencias |

Reintento 1 (re-revisión de seguridad tras la re-implementación):

| Reviewer | Veredicto | Crit. | Alto | Detalle |
|---|---|---|---|---|
| security-reviewer | bloqueante | 1 | 0 | Los 3 bloqueantes previos + el MEDIUM CERRADOS; vector nuevo de la misma clase (IDOR vía creación de usuarios) |

Reintento 2 (re-revisión de seguridad con smoke EN VIVO contra el CMS reiniciado):

| Reviewer | Veredicto | Crit. | Alto | Detalle |
|---|---|---|---|---|
| security-reviewer | bloqueante | 0 | 1 | IDOR de creación de usuarios CERRADO y verificado en vivo (403); toda la matriz de colecciones/campos OK; HIGH nuevo: el global del contenido sin permisos (fuera del alcance documentado) |

Verificación final (re-revisión de seguridad del arreglo del global, con smoke EN VIVO):

| Reviewer | Veredicto | Crit. | Alto | Detalle |
|---|---|---|---|---|
| security-reviewer | **aprobado** | 0 | 0 | HIGH del global CERRADO (replay determinista de 13 ramas + smoke en vivo): editor de otra clienta denegado, super admin y editor de Sabrina OK, endpoint público 200. Sin vector nuevo. 1 LOW (consulta por chequeo de acceso, deuda Fase 3) |

(El dba no se re-corrió en ningún reintento: los fixes son solo funciones de permisos, sin cambios de
esquema. La baseline aprobada en la primera vuelta sigue intacta.)

### Validación de cierre (TDD off — verificada por /fg-review, no por reporte de implement)

- `pnpm -r typecheck`: PASA (exit 0).
- `pnpm -r lint`: PASA (exit 0).
- `pnpm build` (apps/cms): PASA (exit 0).
- `pnpm audit`: 0 critical / 0 high. 14 moderate + 3 low, todas en dependencias transitivas del
  panel de administración y de tooling (esbuild vía drizzle-kit, dompurify vía monaco del panel),
  ninguna nueva ni en el camino de ejecución del endpoint público. Cumple el criterio "sin
  critical/high nuevos".
- Verificación de migraciones (manual, exigida por el diseño): aplicada sobre base limpia en modo
  producción, esquema idéntico al de dev (detalle en `decisiones.md` R1).

### Estructural

No estructural: no se agregaron dependencias nuevas (solo scripts de npm) ni módulos de nivel
superior; los directorios nuevos (`src/lib/`, `src/migrations/`) viven dentro de `apps/cms`. La
baseline es un retrato del esquema ya existente, no una evolución del modelo de datos. No se sugiere
`/fg-update-arch`. (Señal de borde: el detector marca "archivos de migración" como posible disparador
estructural; queda anotado para que el dev confirme, pero el criterio de fondo y la decisión
documentada del cambio es `structural: false`.)
