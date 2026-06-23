# CMS headless de la Plataforma Axs sirviendo a Sabrina

**Tipo:** feat
**Estado:** cerrado
**Nivel de ceremonia:** Completo (plan → diseño → implementación → review)
**Estructural:** true
**arch_synced:** true
**arch_synced_at:** 2026-06-22
**Áreas afectadas:** `apps/cms` (nuevo), `packages/cms-client`, `sites/influencers/sabrina` (consumidor)

---

## Qué

Construir el motor compartido de la plataforma: el CMS headless en `apps/cms`, usando
**Payload sobre PostgreSQL**, que sirva por API los DTOs tipados que el sitio de Sabrina
ya consume. Hoy ese contenido vive como fixtures ficticios dentro de
`packages/cms-client` (`src/fixtures/sabrina.ts`) y la ruta de fetch real está comentada
en `obtenerSitioSabrina()`. La meta de este incremento es que el contenido pase a vivir
en el CMS, que la clienta lo pueda editar desde el panel de Payload, y que el sitio lo
traiga por la API real.

El objetivo concreto y acotado de ESTE incremento:

1. Dejar el CMS (`apps/cms`) levantado sobre Payload + PostgreSQL, con las colecciones
   necesarias para representar el contenido del sitio de Sabrina.
2. Exponer un endpoint que produzca exactamente el DTO `SitioSabrina` que ya define el
   contrato Zod de `cms-client` (`SitioSabrinaSchema`).
3. Migrar el contenido actual de `src/fixtures/sabrina.ts` como **seed inicial** del CMS
   (Sabrina es el primer tenant).
4. Cablear `obtenerSitioSabrina()` al fetch real (hoy comentado), validando la respuesta
   con `SitioSabrinaSchema` en el borde, sin cambiar la firma ni el tipo de retorno que el
   sitio consume.

Es la **Fase 1** del PRD (`docs/PRD-DEFINITIVO-sabrina.md`, sección 9), acotada a dejar el
CMS sirviendo los datos del sitio de Sabrina. El área de mantenimientos/pagos y el deploy
quedan para incrementos posteriores (Fase 2).

## Por qué

El sitio de Sabrina ya está construido y verificado, pero consume contenido desde fixtures
hardcodeados en `cms-client`. Eso contradice el principio rector del proyecto: *el contenido
vive en el CMS y la clienta lo edita sola desde el panel; si algo de contenido obliga a
hardcodear, está mal* (`CLAUDE.md`, PRD sección 13). Mientras el contenido viva en fixtures,
la clienta no puede editar nada y cada cambio de copy o precio exige tocar código y
re-deployar.

El contrato ya está diseñado para este salto: el comentario en `cliente.ts` declara
explícitamente que *"cuando Payload esté arriba, el cuerpo de `obtenerSitioSabrina` pasa a
hacer fetch a la API y parsear la respuesta con el mismo esquema, sin que el sitio cambie"*.
Los esquemas Zod (`SitioSabrinaSchema` y sus partes) son la fuente única de verdad del DTO,
y los fixtures ya están validados contra ellos. Levantar el CMS ahora cierra el lazo que el
diseño de `cms-client` dejó preparado, y habilita el modelo multi-tenant que el PRD describe
(el CMS es compartido; Sabrina es el primer tenant).

## Alcance

### Entra

- **`apps/cms` (Payload + PostgreSQL):** la app del CMS, su `payload.config.ts`, las
  colecciones que modelan el contenido del sitio, conexión a Postgres y panel de
  administración de Payload. Sumado al `pnpm-workspace.yaml` como app del monorepo.
- **Colecciones del CMS:** las necesarias para que el contenido del sitio de Sabrina se
  pueda editar y servir. Como mínimo, el modelo multi-tenant de base (`clientas`,
  `usuarios`, `tipos_seccion` + `secciones`, `medios`) según `docs/esquema.sql`, y la
  composición que produce el DTO `SitioSabrina`. El detalle de cuánto del esquema se
  modela en este incremento lo define `/fg-design`.
- **Endpoint que produce el DTO `SitioSabrina`:** un endpoint (Payload REST/GraphQL o una
  ruta custom) cuya respuesta valide contra `SitioSabrinaSchema` tal como está hoy. El CMS
  se adapta al contrato existente; el contrato no se reinventa.
- **Seed inicial:** migrar el contenido de `packages/cms-client/src/fixtures/sabrina.ts`
  a datos sembrados en el CMS, para que el sitio renderice lo mismo que hoy pero traído de
  la API.
- **Cableado del fetch real en `cms-client`:** descomentar y completar la ruta de fetch en
  `obtenerSitioSabrina()`, leyendo la base URL de la API desde entorno, parseando con
  `SitioSabrinaSchema` y usando `ErrorCms` ante respuestas no-ok. La firma y el tipo de
  retorno (`Promise<SitioSabrina>`) no cambian, así que `sites/influencers/sabrina` no se
  toca.

### Fuera de alcance

- **Mantenimientos, suscripciones y pagos** (`suscripciones`, `mantenimientos`, `pagos`
  del esquema): son Fase 2 del PRD. No se modelan en este incremento más allá de lo que
  el modelo base requiera.
- **Webhook de MercadoPago y confirmación automática de pagos:** mejora posterior (PRD 3).
- **Deploy** (Docker, Coolify, dominios, SSL, backups): Fase 2.
- **Diseño del frontend de Sabrina:** ya está construido; este incremento no toca su
  estructura, layout ni motion. Solo cambia de dónde llega el contenido (fixture → API).
- **Aislamiento fuerte por Row-Level Security:** el esquema lo marca como opcional; el
  access control de Payload por tenant es lo mínimo, RLS a nivel base es diferible.
- **Onboarding de clientas nuevas** (Fase 3): este incremento sienta el multi-tenant pero
  solo siembra a Sabrina.

### Decisiones que `/fg-design` debe resolver (anotadas, no bloquean el plan)

- Si el endpoint que sirve el DTO es la API nativa de Payload (componiendo `secciones` por
  tenant del lado del cliente o de un resolver) o una ruta custom `/api/sitios/sabrina`
  que ya devuelva el DTO ensamblado. El comentario en `cliente.ts` sugiere la segunda
  (`${baseUrl}/api/sitios/sabrina`).
- Cuánto del modelo genérico `tipos_seccion` + `secciones` (JSON por tipo) se implementa en
  este incremento vs. modelar las secciones como colecciones tipadas de Payload. El esquema
  propone el modelo genérico; Payload favorece colecciones tipadas. Tradeoff a evaluar en
  diseño.
- Estrategia de versiones pineadas para las dependencias nuevas de Payload y su adaptador
  de Postgres (ver Restricciones).

## Restricciones

- **Stack cerrado** (`CLAUDE.md`, PRD sección 8): Next.js App Router + TypeScript estricto,
  Payload como CMS headless sobre PostgreSQL. No se cambia el stack.
- **El contrato ya existe, no se inventa uno nuevo:** las colecciones y el endpoint del CMS
  deben producir exactamente el DTO que define `packages/cms-client/src/esquemas.ts`
  (`SitioSabrinaSchema` y sus partes: `ConfigSitio`, `SeccionHero` con `escenas`, `SobreMi`,
  `Pilares`, `Pack`, `ComoTrabajo`, `Experiencias`, `Testimonios`, `Marcas`, `Faq`,
  `Contacto`, `redes`). Si el contrato necesitara cambiar, eso es una decisión explícita de
  diseño, no un efecto colateral.
- **DTOs en camelCase español** (`docs/convenciones.md`): la API expone propiedades en
  camelCase español (`{ descripcion, foto, fechaCreacion }`), tal como ya hacen los
  esquemas. Las tablas/identificadores de DB van en snake_case español, plural, sin tildes
  ni ñ (`docs/esquema.sql`). El mapeo DB→DTO traduce entre ambas convenciones.
- **Identificadores en inglés en código TS** (variables/funciones), nomenclatura de dominio
  y contenido visible en español según convenciones.
- **pnpm con `save-exact=true`:** versiones pineadas exactas (sin `^`/`~`), lockfile
  commiteado, `pnpm audit` en CI. **Cada dependencia nueva de Payload se revisa antes de
  sumarla** (cadena de suministro, PRD sección 8).
- **Nada de contenido hardcodeado en componentes:** el seed migra el contenido al CMS; los
  fixtures dejan de ser la fuente en runtime. Una vez cableado el fetch real, el contenido
  visible viaja por la API.
- **Sin romper al consumidor:** `obtenerSitioSabrina()` mantiene firma y tipo de retorno;
  `sites/influencers/sabrina/app/page.tsx` no debe cambiar.
- **TDD off** (`docs/auditoria/config.yaml`): no hay test runner configurado. La validación
  de cierre la define `/fg-review` con la verificación básica del proyecto (typecheck, lint,
  build, `pnpm audit`).

## Contexto del codebase (CodeGraph)

CodeGraph está indexado y activo. Exploración con
`mcp__codegraph__codegraph_explore` sobre `cms-client`, `obtenerSitioSabrina`, los esquemas
Zod y los fixtures.

Estado actual relevante:

- **`packages/cms-client/src/cliente.ts`** — `obtenerSitioSabrina(_opciones)` hoy retorna
  `SitioSabrinaSchema.parse(sitioSabrina)` (el fixture). El bloque de fetch real está
  comentado (líneas 18-22) y ya esboza la forma esperada:
  `fetch(\`${baseUrl}/api/sitios/sabrina\`)`, manejo de `!res.ok` con `ErrorCms`, y
  `SitioSabrinaSchema.parse(await res.json())`. Define también `OpcionesCliente { baseUrl? }`
  y `ErrorCms(estado, mensaje)`.
- **`packages/cms-client/src/esquemas.ts`** — el contrato completo: `SitioSabrinaSchema`
  compone 13 secciones, cada una con su esquema Zod (incluido `MedioSchema` reusado para
  imágenes, con `url`, `textoAlternativo`, `ancho?`, `alto?`). Es la fuente de verdad del
  DTO; los tipos TS se infieren de acá.
- **`packages/cms-client/src/fixtures/sabrina.ts`** — `sitioSabrina`, el contenido actual,
  ya con la forma del DTO. Es lo que se migra como seed.
- **Consumidores (blast radius):** `obtenerSitioSabrina` se usa en
  `sites/influencers/sabrina/app/page.tsx` y se re-exporta desde `cms-client/src/index.ts`.
  `SitioSabrinaSchema` lo consumen `cliente.ts` y `tipos.ts`. Ningún test cubre estos
  símbolos (no hay suite).
- **`apps/cms` no existe aún.** El monorepo tiene `packages/cms-client` y
  `sites/influencers/sabrina`; `apps/` todavía no está creado. Este incremento lo crea.

## Alineación con el PRD y la arquitectura

`docs/arquitectura/overview.md` todavía no existe. La visión del sistema vive en
`docs/PRD-DEFINITIVO-sabrina.md` (fuente única de verdad), que describe el modelo
CMS-compartido-headless + sitios-a-medida y enmarca este incremento como su Fase 1. El
`overview.md` de arquitectura se derivará del PRD en un paso de `/fg-update-arch` posterior;
no es bloqueante para este plan. El modelo de datos de referencia está en `docs/esquema.sql`
y las convenciones de nomenclatura en `docs/convenciones.md`.

Por ser un cambio **estructural** (crea la app `apps/cms`, suma dependencias de Payload y
Postgres, cablea el contrato de datos a la API real), al cerrar `/fg-review` debería sugerir
`/fg-update-arch` para sincronizar la documentación de arquitectura.

## Cierre

**Fecha de review:** 2026-06-22 · **Modo:** TDD off (validación básica del proyecto).

### Qué quedó hecho

La Fase 1 del PRD quedó implementada y funcionando en entorno de desarrollo:

- `apps/cms` levantado (Payload 3.85.1 + Next 16 App Router) sobre PostgreSQL 17.5, con
  colecciones `clientas`, `usuarios` (auth con roles + access control por tenant), `medios`,
  y el Global tipado `sitio-sabrina` (13 bloques que espejan 1:1 `SitioSabrinaSchema`).
- Endpoint público `GET /api/sitios/sabrina` que ensambla y devuelve el DTO. Verificado en
  vivo: responde `HTTP 200` con las 13 claves del contrato y las 3 escenas del hero.
- Seed idempotente desde `packages/cms-client/src/fixtures/sabrina.ts`.
- `obtenerSitioSabrina()` cableado al fetch real (firma y tipo de retorno preservados);
  `sites/influencers/sabrina/app/page.tsx` no se tocó.

### Qué se difirió (Fase 2)

Deploy (Docker/Coolify/dominios/SSL), mantenimientos/suscripciones/pagos, webhook de
MercadoPago, rate limiting del endpoint, upload real de binarios a `medios` (hoy `imagen`
inline) y RLS a nivel base. Todo registrado en `decisiones.md`.

### Validación de cierre (corrida y confirmada por /fg-review, no heredada)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `pnpm -r typecheck` | PASS (cms-client, sabrina, cms) |
| Lint | `pnpm -r lint` | PASS (cms, sabrina) |
| Build | `pnpm -r build` | PASS (ambas apps Next; ruta `/api/sitios/sabrina` presente como dynamic) |
| Audit | `pnpm audit` | 17 vulns: 3 low + 14 moderate, **0 critical/high**, todas transitivas del admin panel de Payload (dompurify vía @monaco-editor, esbuild vía drizzle-kit) |

Secretos: `apps/cms/.env` existe en disco pero está git-ignored y **no trackeado**; sin
`PAYLOAD_SECRET` hardcodeado en source; `.env.example` con placeholder. Verificado.

### Reviews especializados

| Role | Verdict | Crit/High | Resumen |
|---|---|---|---|
| `code-reviewer` | issues_found | 0 / 0 | 1 WARNING (correctness) + 6 SUGGESTION. Sin bloqueantes. |
| `security-reviewer` | issues_found | 0 / 0 | 1 MEDIUM + 2 LOW. Sin bloqueantes. 1 punto a verificar (self-elevación de rol). |
| `dba-reviewer` | blocking* | 1 / 1 | CRITICAL **acotado a deploy a producción** (sin migraciones generadas) + 1 HIGH. Resuelto por decisión de alcance → deuda Fase 2. |

\* El `blocking` del dba-reviewer era **condicional**: el CRITICAL bloquea la *promoción a
producción*, no el cierre de Fase 1 en dev (el propio review lo aclara: "para dev esto es
correcto y funciona"). Deploy a prod está **fuera de alcance** de este incremento (Fase 2) y
la deuda de migraciones ya estaba pre-declarada.

**Decisión de alcance (resuelta por el dev):** cerrar la Fase 1 en dev. El deploy a producción
(migraciones, `push:false`, `migrate` en CI) es Fase 2 y queda fuera de este incremento. En
consecuencia el CRITICAL del dba-reviewer **no bloquea el cierre** y se registra como deuda
conocida de Fase 2 (ver "Deuda registrada" abajo). No se reintentó `/fg-implement`: el cambio
está completo dentro de su alcance.

#### Issues consolidados por severidad

**CRITICAL (dba) — bloquea producción, no Fase 1/dev**
- `apps/cms/payload.config.ts:30` — `push` desactivado en prod pero `apps/cms/src/migrations/`
  vacío (0 archivos, verificado) y sin script `payload migrate` cableado. Sin push y sin
  migraciones, el esquema no se crea/actualiza en prod. **Antes de prod:** generar baseline
  (`payload migrate:create`), commitearla, cablear `migrate` en deploy/CI, confirmar
  `push:false` efectivo. No implementar en este cambio.

**HIGH (dba) — aceptable para Fase 1 con seed controlado**
- `apps/cms/src/seed/sabrina.ts:11` — seed check-then-act sin transacción ni apoyo en el
  constraint `unique` de `slug`: dos runs concurrentes podrían duplicar la clienta. La
  idempotencia documentada no aguanta concurrencia. Capturar la violación de `unique` o
  envolver en transacción.

**MEDIUM**
- `apps/cms/src/app/api/sitios/sabrina/route.ts:260` (security) — el 500 devuelve
  `detalle: error.message` en un endpoint público; puede filtrar internals de infra
  (SQL, nombres de tablas, driver). Loguear server-side y devolver mensaje genérico sin `detalle`.
- `apps/cms/src/collections/Usuarios.ts:8` (dba) — `email` unique lo aporta `auth:true`;
  confirmar en el DDL generado que la columna tiene `UNIQUE` a nivel Postgres.
- `apps/cms/src/collections/Usuarios.ts:31` (dba) — FK `clienta` (y `medios.clienta`) sin
  `index:true`; el access control filtra por esa columna. Agregar índice antes de que escale.

**WARNING / verificación**
- `apps/cms/src/app/api/sitios/sabrina/route.ts:147` (code) — defensa asimétrica: solo
  `config` se valida (422); el resto se rellena con `?? ""`/`?? []`. Si `hero.escenas` queda
  vacío, el endpoint responde 200 pero el `.parse()` del cliente lanza un ZodError no tipado
  (por `escenas.min(1)`) que `page.tsx` no captura. Validar la salida contra el schema en el
  endpoint o chequear `escenas.length >= 1` junto a `config`.
- `apps/cms/src/collections/Usuarios.ts` (security) — verificar si un `tenant_editor` puede
  auto-modificar su campo `rol` a `super_admin`. Si se confirma, sería privilege escalation
  (CRITICAL). Hardening: restringir `access.update` del campo `rol` a `super_admin`.

**LOW / SUGGESTION (no bloqueantes)**
- `docker-compose.yml:7` — credenciales Postgres de dev en claro (`axs/axsdev`); aceptable
  para dev local, parametrizar para staging/prod.
- Endpoint sin rate limiting (diferido a Fase 2, registrado).
- `route.ts` — tipar `global` con el tipo autogenerado de Payload en vez de ~13 casts manuales.
- `seed/index.ts:19` — `process.exit(0)` forzado puede truncar flush del pool/logger.
- Global singleton `sitio-sabrina` no es multi-tenant real (un global por instalación);
  coherente con Fase 1, rediseñar a colección-por-tenant en Fase 3. Documentado.

### Deuda registrada (ninguna bloquea el cierre de Fase 1)

Resultado de la decisión de alcance del dev. Nada de esto se reintenta en este cambio;
queda anotado para abordarse en hardening / Fase 2.

| # | Item | Origen | Prioridad | Fix |
|---|---|---|---|---|
| 1 | **Migraciones de producción inexistentes.** `apps/cms/src/migrations/` vacío (verificado) y sin script `payload migrate`; con `push:false` en prod el esquema no se crea/actualiza. | dba CRITICAL (`payload.config.ts:30`) | **Fase 2 — bloqueante para deploy a prod** | Generar baseline `payload migrate:create`, commitearla en `src/migrations/`, cablear `payload migrate` en el deploy/CI, confirmar `push:false` efectivo en prod. |
| 2 | **500 del endpoint público filtra `error.message`.** Puede exponer internals de infra (SQL, tablas, driver) en `/api/sitios/sabrina`. | security MEDIUM (`route.ts:260`) | **Temprana (barato, seguridad)** | Loguear el `message` server-side y devolver mensaje genérico sin el campo `detalle`. |
| 3 | **Guard para `hero.escenas` vacío.** Si el global queda sin escenas, el endpoint responde 200 pero el `.parse()` del cliente lanza un ZodError no tipado (`escenas.min(1)`) que `page.tsx` no captura. | code WARNING (`route.ts:147`) | **Temprana (barato, correctness)** | Validar la salida contra el schema en el endpoint, o chequear `escenas.length >= 1` junto a la validación de `config` y devolver 422. |
| 4 | **Verificar auto-elevación de rol.** ¿Un `tenant_editor` puede modificar su propio campo `rol` a `super_admin`? Hoy NO explotable (no hay usuarios cargados), pero potencial privilege escalation. | security VERIFICAR (`Usuarios.ts`) | **Hardening — verificar antes de cargar usuarios reales** | Confirmar el comportamiento de Payload sobre self-update; si aplica, restringir `access.update` del campo `rol` a `super_admin` a nivel de field. |
| 5 | **Seed sin transacción/constraint vs concurrencia.** Dos runs solapados podrían duplicar la clienta; la idempotencia depende de no haber concurrencia. | dba HIGH (`seed/sabrina.ts:11`) | Fase 2 (aceptable con seed controlado) | Apoyar en el `unique` de `slug` (capturar la violación y reusar el doc) o envolver `find`+`create` en transacción. |
| 6 | **`email` unique y FK `clienta` sin índice.** Confirmar `UNIQUE` de `email` a nivel Postgres; agregar `index:true` a la FK `clienta` en `Usuarios` y `Medios`. | dba MEDIUM (`Usuarios.ts:8,31`, `Medios.ts:25`) | Fase 2 (degrada con escala) | Verificar el DDL generado; agregar índices al campo relationship. |
| 7 | **Credenciales Postgres de dev en claro** (`axs/axsdev`) en `docker-compose.yml`; **rate limiting** del endpoint; **casts manuales** del global en vez de `payload-types`; **`process.exit(0)`** del seed; **Global singleton no multi-tenant**. | code/security/dba LOW·SUGGESTION | Fase 2 / Fase 3 | Parametrizar creds para staging/prod; rate limiting + caché HTTP; usar el tipo autogenerado; cerrar el pool antes del exit; migrar a colección-por-tenant en onboarding. |

### Validación TDD

No aplica: `rules.implement.tdd: false`, sin test runner ni suite (`coverage_threshold: 0`).
No hay TDD Cycle Evidence que validar ni cobertura que exigir. La SUGGESTION de
`code-reviewer` y `dba-reviewer` coincide: cuando el proyecto incorpore runner, el primer
test a escribir es el de **paridad seed ↔ fixture** del mapeo global→DTO (el riesgo declarado
en `diseño.md`).

### Cambio estructural — se sugiere `/fg-update-arch`

Este cambio es **estructural**: crea el módulo top-level `apps/cms` (nuevo motor de datos),
suma dependencias mayores (stack Payload) al `pnpm-lock.yaml`, y cablea el contrato de datos
a la API real. `docs/arquitectura/overview.md` **no existe todavía**.

> Se recomienda correr `/fg-update-arch` para derivar `docs/arquitectura/overview.md` del PRD
> y documentar el motor `apps/cms` (colecciones, el Global, el endpoint del DTO) y el flujo
> sitio → cms-client → endpoint → Payload → Postgres. El dev decide cuándo. No se auto-invoca.
