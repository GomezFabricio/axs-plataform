# Decisiones — Hardening del CMS y baseline de migraciones para deploy

**Cambio:** `2026-06-chore-hardening-cms-deploy`

> Registro append-only. Cada decisión: fecha (YYYY-MM-DD) + qué se decidió + por qué. Nunca se
> sobrescribe; `/fg-implement` agrega al final las decisiones que surjan en el código.

---

- **2026-06-24 — Proyecto no legacy: se omite el análisis de impacto (`legacy-impact-analyzer`).**
  El monorepo es greenfield (5 commits, primer commit 2026-06-21), forge recién instalado, y el
  mismo criterio ya quedó registrado en el cambio de Fase 1. `bootstrap.is_legacy_project` no
  aplica. Se salta el paso 2b de `/fg-design`. El único consumidor del endpoint
  (`obtenerSitioSabrina`) se preserva con contrato intacto (verificado con CodeGraph: blast radius
  = `sites/influencers/sabrina/app/page.tsx`).

- **2026-06-24 — D1. Rate limiting: limiter in-memory por IP con ventana fija, sin dependencia
  nueva.** Se descarta (b) sumar una dependencia dedicada y (c) delegar todo a la infra.
  Razones: el endpoint se consume desde un Server Component con `next: { revalidate: 60 }`, así
  que el tráfico real al CMS es bajo y cacheado; en Fase 2 el CMS corre como instancia única (el
  deploy real es un incremento posterior). Un limiter in-memory cubre el caso sin sumar peso a la
  cadena de suministro (PRD sección 8: cada dep nueva exige vetting + `pnpm audit`). Forma: módulo
  propio `src/lib/rateLimit.ts`, función pura `consultarRateLimit(clave, ahora?)` con ventana fija
  por IP. Parámetros iniciales: **60 requests / 60 s por IP** (holgado frente al revalidate de 60 s
  del único consumidor legítimo; corta abuso real sin afectar el camino feliz). **Limitación
  declarada y diferida:** el estado in-memory NO resiste múltiples instancias ni serverless; cuando
  se cablee el deploy real (multi-instancia/edge/serverless) hay que reemplazarlo por un limiter
  apoyado en la DB, edge, o el reverse-proxy. Queda anotado como deuda explícita para el incremento
  de deploy. Razón de no resolverlo ahora: sería sobre-ingeniería para Fase 2 y ataría una decisión
  de infra que todavía no está tomada.

- **2026-06-24 — D2. Baseline de migraciones: generada y validada sobre base limpia, DDL puro
  separado del seed.** La baseline se genera con `payload migrate:create` partiendo de una **base
  limpia** (Postgres dev en Docker recreado vacío), no de la base de dev ya pusheada, para que la
  migración describa el esquema completo y no un diff parcial con drift. Validación: sobre otra
  base totalmente vacía se corre `migrate` con `push:false` (`NODE_ENV=production`) y se compara el
  esquema resultante (tablas, columnas, tipos, FKs, índices, tabla `payload_migrations`) contra el
  de dev. Se configura `migrationDir` explícito en el adapter para fijar la ubicación
  (`src/migrations/`) y evitar ambigüedad de cwd al correr el CLI desde la raíz del monorepo.
  **Separación DDL / seed (no negociable):** la migración es solo schema; el seed (`src/seed/`)
  queda intacto y desacoplado — ni la migración invoca el seed ni el seed crea schema. En prod
  corre `migrate` (DDL); el seed es operación aparte de dev/staging. Sin dependencias nuevas: el
  CLI `payload migrate*` ya viene en `payload@3.85.1`.

- **2026-06-24 — D3. Access control del rol: auto-elevación CONFIRMADA explotable → fix a nivel
  field.** Verificación del modelo de Payload 3.x (Context7 no disponible en esta fase; se razonó
  sobre el modelo de access de Payload y el código de `accesoPorTenant`): el `access.update` de la
  colección `usuarios` es `accesoPorTenant`, que para un `tenant_editor` con `clienta` asignada
  retorna `{ clienta: { equals: clientaId } }`; **su propio doc de usuario comparte ese `clienta`**,
  por lo que el editor puede actualizar su propio usuario. El field `rol` no tiene access a nivel
  field, y en Payload 3.x un field sin `access.update` es escribible por cualquier usuario que pase
  el access de colección. Conclusión: un `tenant_editor` puede setear `rol: "super_admin"` en su
  propio doc → privilege escalation real. Fix: `access.update` a nivel del field `rol` que solo
  retorne `true` cuando `req.user?.rol === "super_admin"`. Field-level access se evalúa por encima
  del de colección: el editor puede seguir guardando su doc, pero el valor entrante de `rol` se
  descarta. No se toca `accesoPorTenant` (lo usan otras colecciones). El flujo legítimo de
  `super_admin` editando roles y el `registerFirstUser` del bootstrap no se ven afectados — a
  verificar en el smoke manual de cierre (T11).

- **2026-06-24 — D4. Workaround para bug de tsx 4.22.4 + Node.js 26 en `migrate:create`.**
  Durante la implementación de T3 (baseline de migraciones) se detectó un bug de incompatibilidad:
  tsx 4.22.4 (usado internamente por el CLI de Payload 3.85.1) falla con Node.js 26.0.0 cuando
  intenta crear un namespace aislado para `tsImport()`. El error es
  `ENOENT: no such file or directory, open 'node:crypto?tsx-namespace=<timestamp>'` — tsx agrega
  un query string de namespace al specifier `node:crypto` que Node.js 26 interpreta como path de
  filesystem en el hook CJS loader. La raíz: tsx registra hooks con `module.registerHooks` y al
  procesar módulos CJS que importan `node:crypto`, el namespace es agregado al specifier antes de
  que la condición de exclusión `t.startsWith("node:")` pueda aplicarse en el hook ESM. El fix
  upstream requiere actualizar tsx (el bug fue reportado y corregido en versiones posteriores a
  4.22.4), pero las deps del proyecto están pineadas exactas y no se puede agregar deps nuevas sin
  vetting. **Workaround elegido**: la migración baseline se genera a partir del DDL real del
  esquema de dev (obtenido via `pg_dump --schema-only` sobre la base `axs_cms` que ya tiene el
  schema pusheado por Payload en modo dev) y se construye manualmente en el formato correcto de
  Payload (`@payloadcms/db-postgres`), usando el template de `getMigrationTemplate` de
  `@payloadcms/drizzle`. El snapshot JSON de drizzle-kit se genera usando la API `generateDrizzleJson`
  de `drizzle-kit/api` vía `createRequire` (CJS, sin tsx). Esta baseline es funcionalmente
  equivalente a la generada por el CLI: contiene el DDL completo del esquema actual sin datos de
  seed. Cuando la versión de tsx o de Node.js se actualice, la migración puede regenerarse con
  el CLI normalmente. Deuda: actualizar tsx cuando se actualice Payload (que traerá la versión
  corregida de tsx como dep).

- **2026-06-24 — R1. /fg-review: verificación empírica de la baseline (D4) — APROBADA.** Se aplicó
  la migración con `NODE_ENV=production pnpm migrate` (push:false) sobre una base PostgreSQL limpia
  throwaway (`axs_cms_review`, Docker postgres:17.5) y se comparó su esquema contra el de dev
  (`axs_cms`, pusheado por Payload). La migración aplicó limpio (45ms), quedó registrada en
  `payload_migrations` batch=1, y el esquema resultante es FIEL: 22 tablas, 2 enums, 170 columnas,
  20 FKs, 76 índices, todos IDÉNTICOS (validado con conteos agregados + diff per-objeto de
  columnas/FKs/índices/enums + hashes md5 por objeto del dba-reviewer, que cubrieron orden de
  columnas, opclasses, ON DELETE/UPDATE, enum sort order, ausencia de CHECK constraints/comments y
  10=10 secuencias). Única diferencia: el default de `usuarios.login_attempts` renderiza `0` en dev
  y `'0'::numeric` en la migrada — artefacto de display de `column_default`; `pg_get_expr` resuelve
  ambos a `0`, mismo tipo numeric, misma nullability, NO es divergencia. Tras `migrate` (sin seed)
  las tablas quedan vacías → DDL puro, seed desacoplado (T5 confirmado). El método manual D4 no
  introdujo huecos detectables. El dba-reviewer marcó un WARNING: `down()` está vacío (línea
  299-301), así que `migrate:down` se daría por exitoso removiendo la fila de `payload_migrations`
  sin revertir el DDL → estado inconsistente silencioso; recomendación diferida: hacer `down()`
  lanzar un Error explícito ("baseline no reversible"). No bloquea el deploy forward.

- **2026-06-24 — R2. /fg-review: el security-reviewer amplió el alcance de la deuda de authz —
  cierre BLOQUEADO.** El fix F2.3 del campo `rol` (D3) está implementado correctamente y cierra el
  vector exacto documentado (auto-update de `rol` por un `tenant_editor`), pero el security-reviewer
  descubrió que la misma clase de deuda de authz multi-tenant deja TRES caminos adyacentes abiertos,
  todos verificados contra el código por /fg-review:
  - **CRITICAL — colección `Clientas` sin bloque `access`** (`Clientas.ts:8-48`): sin `access`
    explícito, el default de Payload permite a cualquier usuario autenticado CRUD de clientas
    arbitrarias (un `tenant_editor` puede desactivar/renombrar/cambiar slug/dominio de otra clienta,
    o crear tenants fantasma). La misma colección `Medios` (`Medios.ts:9-33`) tiene idéntico hueco
    (no flageado por el reviewer pero confirmado por /fg-review). Rompe el aislamiento multi-tenant.
  - **CRITICAL — campo `clienta` de `Usuarios` sin field-access** (`Usuarios.ts:33-41`): como
    `accesoPorTenant` deja a un editor actualizar su propio doc, y `clienta` no tiene
    `access.update` a nivel field, el editor puede reasignarse a otra clienta (IDOR cross-tenant).
  - **HIGH — `rol` sin `access.create`** (`Usuarios.ts:20-32`): el fix cubre solo `update`; la
    colección `usuarios` no restringe `create`, así que un editor con permiso de crear usuarios
    podría setear `rol: "super_admin"` al crear (escalamiento por la vía de creación).
  Naturaleza: son deudas de authz PRE-EXISTENTES de Fase 1, no regresiones introducidas por este
  cambio, y caen fuera del alcance documentado de F2.3 (que el README acotó al `update` del campo
  `rol`). Pero son la misma clase de hueco que F2.3 vino a cerrar y están confirmadas explotables en
  el módulo que este incremento se propuso endurecer, por lo que /fg-review devuelve `status:
  blocked` para que el orquestador conduzca la re-implementación acotada que extienda el fix de
  authz a esos tres puntos (más `Medios`). El security-reviewer también marcó MEDIUM el crecimiento
  sin tope del `Map` del rate limiter (`rateLimit.ts:22`) como vector de DoS de memoria de Fase 2
  (recomendado resolver en este incremento), y dejó como deuda aceptable y ya documentada en D1 el
  spoofing de `x-forwarded-for` y el burst de ventana fija.

- **2026-06-24 — R3. /fg-review: hallazgos no bloqueantes del code-reviewer.** WARNING:
  `Retry-After` se calcula sin clamp (`route.ts:22`), puede dar 0 o negativo en el borde de ventana
  (header inválido por RFC 7231; fix trivial `Math.max(0, ...)`). SUGGESTIONs: el JSDoc de
  `consultarRateLimit` dice "función pura" pero muta el `Map` global (`rateLimit.ts:9`); el script
  `migrate:fresh` es destructivo y queda expuesto sin guard (`package.json:16`); `rateLimit.ts` es
  lógica determinista con edge cases ideales para tests cuando se monte suite (TDD off, no bloquea).

- **2026-06-24 — D5. Re-implementación de authz (re-iteración acotada post R2): estrategia por
  colección y decisión sobre `rol.access.create`.**
  - **Clientas**: el `read` multi-tenant NO puede usar `accesoPorTenant` directamente porque los
    documentos de `Clientas` SON los tenants (no tienen un field `clienta` que los vincule a otro
    tenant — ellos mismos son el root). El filtro correcto para `read` es `{ id: { equals: clientaId } }`,
    aplicado solo cuando el usuario tiene `clienta` asignada. `create`/`update`/`delete` restringidos
    a `super_admin` (un tenant_editor no tiene razón de crear o modificar tenants).
  - **Medios**: tiene field `clienta` propio (relationship), así que `accesoPorTenant` funciona
    directamente para `read`, `create`, `update`, `delete`. Un `tenant_editor` puede subir y gestionar
    sus propios medios; el filtro por tenant que devuelve `accesoPorTenant` asegura que no puede
    tocar los de otra clienta.
  - **Usuarios.clienta field (IDOR)**: `access.update: ({ req }) => req.user?.rol === "super_admin"`.
    Mismo criterio que ya aplicaba al field `rol`. Un editor puede ver su propio usuario pero no puede
    reasignarse a otro tenant.
  - **Usuarios.rol field create (HIGH)**: se elige `access.create` a nivel field en lugar de
    `access.create` a nivel colección, por las siguientes razones: (1) restricción de colección
    bloquearía completamente la creación de usuarios por parte de `tenant_editor` en flujos futuros
    (potencialmente válidos); (2) field-level es más fino: el `rol` defaultea a `tenant_editor` y
    si el creador no es `super_admin`, Payload descarta el valor entrante del campo y aplica el
    default — conservando el flujo legítimo de `super_admin` creando cualquier tipo de usuario.
  - **rateLimit.ts evicción**: se agrega `purgarExpirados(ahora)` — recorre el Map y elimina buckets
    cuya ventana ya venció antes de procesar cada request. Amortigua el crecimiento de memoria ante
    rotación de IPs. Costo O(n) sobre la población activa en 60 s (acotada en Fase 2 con instancia
    única). API y comportamiento 60/60s sin cambio.

- **2026-06-24 — R4. /fg-review reintento 1: los 3 bloqueantes de R2 CERRADOS, pero la decisión D5
  (field-level create de `rol`) dejó abierto un vector NUEVO de la misma clase → cierre RE-BLOQUEADO.**
  Verifiqué contra el código que los tres CRITICAL/HIGH de R2 quedaron efectivamente cerrados:
  Clientas con bloque `access` (read filtra por `id`, mutaciones solo super_admin); Medios con
  `accesoPorTenant`; campo `clienta` de Usuarios con `access.update` super_admin (cierra el IDOR de
  update); campo `rol` con `access.create`+`access.update` super_admin (cierra la escalada de rol al
  crear). El MEDIUM del Map del rate limiter también cerrado (`purgarExpirados` borra solo buckets
  con ventana vencida, no toca la vigente; comportamiento 60/60s intacto). Read de Clientas sin
  `clienta` asignada → `return false` limpio (super_admin retorna true antes); flujo legítimo de
  super_admin intacto. PERO el security-reviewer descubrió, y /fg-review confirmó, un vector NUEVO
  CRITICAL de IDOR cross-tenant por la ruta de CREATE de usuarios, consecuencia directa de la
  elección de D5 de NO restringir el `create` a nivel colección:
  - **CRITICAL — `Usuarios` sin `access.create` a nivel colección** (`Usuarios.ts:14-18`): la
    colección define read/update/delete pero no create; en Payload el op no especificado cae al
    default permisivo (cualquier admin autenticado), así que un `tenant_editor` puede crear usuarios.
  - **CRITICAL — campo `clienta` de Usuarios sin `access.create`** (`Usuarios.ts:39-51`): field-access
    es restricción opt-in; sin `create`, el campo es escribible al crear por cualquiera. El fix del
    IDOR cubrió solo `update`. Combinado con el create de colección abierto, un `tenant_editor` crea
    un usuario y le asigna una clienta ajena → mismo cruce de frontera multi-tenant que R2 issue 2,
    por la puerta de create.
  Nota menor (no bloqueante, misma familia): el campo `clienta` de **Medios** tampoco tiene
  field-access, así que un editor con clienta podría intentar setear otra clienta en un medio nuevo;
  conviene aplicar el mismo patrón al cerrar lo de Usuarios. Corrección acotada (dos guards
  super_admin, mismo patrón ya usado): agregar `access.create` a la colección `usuarios` y al field
  `clienta`. Esto revisa la decisión D5: el create de usuarios SÍ debe restringirse a super_admin en
  Fase 2 (no hay flujo legítimo de tenant_editor creando usuarios todavía). /fg-review devuelve
  `status: blocked` — reintento 1 de máximo 2; el orquestador conduce el reintento 2 (último).
  Gates de cierre re-verificados en esta vuelta y TODOS verdes: typecheck PASS, lint PASS, build
  PASS, audit 0 critical/0 high. La parte de migraciones (dba aprobada en R1) no se tocó (los fixes
  son solo funciones de access, sin DDL).

- **2026-06-24 — D6. Modelo de permisos definitivo post-auditoría comprehensiva (reintento 2).**

  Descubrimiento clave: en Payload 3.x con `auth: true`, el hot reload del servidor Next.js dev NO
  recarga las collection configs de Payload al vuelo. Los cambios a collection configs requieren
  reiniciar el proceso Next.js dev. Esto causó confusión en el smoke test — las restricciones de
  `create` no se reflejaban en el servidor en ejecución, pero el código es correcto (verificado
  por typecheck, lint, build y análisis del source de Payload en `node_modules`). El dev debe
  reiniciar el CMS dev server para que las nuevas configs entren en vigor.

  **Barrera triple para create en `Usuarios` (auth collection):**
  1. `access.create` a nivel colección — efectivo en Local API y REST post-restart.
  2. `hooks.beforeChange` lanza `APIError(403)` si creador no es super_admin — efectivo en REST
     (evaluado por `createOperation` en `collections/operations/create.js:123-134`). `beforeOperation`
     fue descartado: Payload lo mapea via `buildBeforeOperation` con la misma firma, pero hay un
     problema de timing en el hot reload. `beforeChange` es la barrera efectiva confirmada por el
     source del framework.
  3. `fields.rol.access.create` y `fields.clienta.access.create` — descartan valores inválidos.

  **Modelo de permisos definitivo — matriz completa:**

  | Colección | create | read | update | delete |
  |---|---|---|---|---|
  | `Clientas` | solo `super_admin` | `super_admin`=todo; editor=`{id:clientaId}` | solo `super_admin` | solo `super_admin` |
  | `Medios` | `accesoPorTenant` | `accesoPorTenant` | `accesoPorTenant` | `accesoPorTenant` |
  | `Usuarios` | solo `super_admin` (barrera triple) | `accesoPorTenant` | `accesoPorTenant` | solo `super_admin` |

  | Field | access.create | access.update |
  |---|---|---|
  | `Usuarios.rol` | solo `super_admin` | solo `super_admin` |
  | `Usuarios.clienta` | solo `super_admin` | solo `super_admin` |
  | `Medios.clienta` | solo `super_admin` (hook auto-asigna en create para editor) | solo `super_admin` |

  **Flujos legítimos preservados:**
  - `registerFirstUser` (`/first-register`): bypasea hooks y access — correcto para bootstrap.
  - `super_admin`: crea usuarios de cualquier rol, asigna clientas, cambia roles, lee/edita todo.
  - `tenant_editor`: sube medios a su clienta (auto-asignada por `beforeChange`), ve sus medios
    y su propia clienta, edita su perfil salvo `rol`/`clienta`.
  - Contrato intacto: `SitioSabrinaSchema` sin cambio, firma de `obtenerSitioSabrina()` sin cambio,
    `sites/influencers/sabrina` sin tocar, DDL sin cambio (solo funciones de access).

  **Smoke test constraint**: las restricciones de create solo se verifican en el servidor en ejecución
  tras un restart del proceso. El dev debe correr `pnpm --filter @axs/cms dev` (o reiniciar el
  proceso existente) para activar las nuevas collection configs antes de verificar el panel de Payload.

- **2026-06-24 — D7. Access control del global `SitioSabrina` — solución pragmática para Fase 2,
  deuda Fase 3 explícita (autorizado por el dev fuera del budget de reintentos).**
  El global `SitioSabrina` es un singleton sin field `clienta` que lo vincule a un tenant. No puede
  usar `accesoPorTenant` directamente (que filtra por `{ clienta: { equals: id } }` en el documento,
  que no existe en el global). La solución implementada:
  - Función async `esEditorDeSabrina({ req }: AccessArgs): Promise<boolean>` que:
    1. Retorna `false` para no autenticados.
    2. Retorna `true` para `super_admin`.
    3. Para `tenant_editor`: consulta `clientas` via Local API (`req.payload.find`) buscando el slug
       `"sabrina"` (constante `SLUG_CLIENTA_SABRINA`, no id numérico hardcodeado). Compara el id
       resultante con `req.user.clienta` usando `String()` para neutralizar el type mismatch
       int/string. Retorna `true` solo si coinciden.
  - `access: { read: esEditorDeSabrina, update: esEditorDeSabrina }` en la config del global.
  - `overrideAccess: true` en la consulta interna de clientas — es una operación del sistema de
    access control, no una acción del usuario, así que no debe re-evaluarse contra el propio access.
  Flujos legítimos verificados EN VIVO con CMS reiniciado:
  - `super_admin` lee/actualiza el global: **200** ✓
  - Editor de Sabrina (clienta id=1, slug="sabrina") lee/actualiza el global: **200** ✓
  - Endpoint público `/api/sitios/sabrina`: **200** (Local API usa `overrideAccess:true` por default) ✓
  **DEUDA FASE 3 explícita**: este global es un singleton que no modela el aislamiento multi-tenant
  de forma nativa. Cuando se sume un segundo tenant, la solución correcta es un global por tenant
  (o una colección `sitios` con un documento por tenant), no un singleton compartido. El lookup por
  slug `"sabrina"` es transitorio: funciona con una clienta pero escala mal. La migración al modelo
  multi-tenant correcto (colección o global por tenant + routing por clienta en el endpoint) es
  trabajo de Fase 3 y queda anotada como deuda explícita. El `SLUG_CLIENTA_SABRINA` como constante
  (no id) es la única decisión que facilita esa migración futura sin romper la API actual.

- **2026-06-24 — R5. /fg-review reintento 2 (último del ciclo): TODOS los huecos de authz de
  COLECCIONES cerrados y verificados EN VIVO; pero el security-reviewer descubrió un HIGH nuevo en una
  superficie no cubierta por D6 (el global `SitioSabrina` sin `access`) → cierre BLOQUEADO. Decisión de
  scope elevada al dev.** Con el CMS dev reiniciado (configs activas), el security-reviewer corrió smoke
  EN VIVO con un `tenant_editor` real y confirmó que el cierre comprehensivo del reintento 2 funciona:
  - `POST /api/usuarios` como tenant_editor (con `rol:super_admin`, `clienta` ajena) → **403** (cierra
    el CRITICAL del create-IDOR de R4). La barrera efectiva es doble: `access.create` de colección
    (evaluado por `createOperation`) + `beforeChange` (APIError 403). El reviewer corrigió un error
    fáctico del comentario del código: NO hay endpoint de registro separado para `POST /api/usuarios`;
    va al `createHandler` genérico que SÍ evalúa `access.create` Y `beforeChange`. Ambas capas activas.
  - `POST /api/medios` con `clienta` ajena → medio creado con la clienta PROPIA (field-access descarta
    el valor entrante, hook `beforeChange` fuerza `req.user.clienta`). Editor SIN clienta → 403.
  - `registerFirstUser` (`/first-register`) intacto (bootstrap del primer super_admin no se bloquea).
  - Map del rate limiter acotado (`purgarExpirados`). Matriz colección×verbo coincide con D6.
  **Hueco NUEVO — HIGH `apps/cms/src/globals/SitioSabrina.ts:10`**: el global NO tiene bloque `access`.
  Por el default de Payload (cualquier admin autenticado puede leer/escribir un global sin `access`),
  un `tenant_editor` puede ESCRIBIR el contenido público del sitio. VERIFICADO EN VIVO: el reviewer
  hizo `POST /api/globals/sitio-sabrina` con sesión de tenant_editor → HTTP 200 y la mutación persistió
  en `sitio_sabrina.contacto_titulo`; tamper revertido y limpiado tras la prueba (confirmado por
  /fg-review: 0 filas con 'HACKED', 0 medios de prueba, working tree limpio). Es la MISMA clase de
  authz multi-tenant que el cambio vino a endurecer, en una superficie (globals) que la matriz D6 no
  auditó. **Impacto hoy: bajo** — hay un solo tenant, así que el único editor (el de Sabrina) edita el
  contenido de Sabrina, que es su flujo legítimo; se vuelve explotable (defacement cross-tenant) recién
  al sumar un segundo tenant. El diseño ya anota "Global singleton no multi-tenant (Fase 3)" como deuda
  conocida.
  **Decisión de scope (la toma el dev, no /fg-review ni el orquestador):** el alcance DOCUMENTADO de
  este incremento (F2.3, matriz D6) fue authz de COLECCIONES y FIELDS; el global quedó fuera. Todo lo
  que el cambio se comprometió a cerrar está cerrado y verificado. El HIGH del global es real y
  live-verified, así que la lectura de seguridad pura es `blocking` y /fg-review NO lo degrada en
  silencio. Pero como es un HIGH de bajo impacto presente, fuera del scope comprometido, y de la misma
  familia que la deuda Fase 3 ya anotada, hay dos caminos válidos y el dev elige: (A) cerrarlo ahora en
  este incremento (corrección acotada: agregar `access.read`/`access.update` al global atados a la
  clienta dueña / super_admin) — esto sería un 3er reintento que excede el tope de 2; o (B) aceptarlo
  como deuda EXPLÍCITA documentada para el incremento multi-tenant (Fase 3) y cerrar este cambio con la
  excepción registrada. /fg-review devuelve `status: blocked` y eleva la decisión: tope de 2 reintentos
  alcanzado, el orquestador escala al dev sin reintentar más. Gates de cierre re-verificados TODOS
  verdes (typecheck/lint/build PASS, audit 0 critical/0 high). Migraciones (dba R1) sin tocar (solo
  funciones de access, sin DDL). LOW remanente (no bloqueante, ya en R3): `Retry-After` sin clamp.

- **2026-06-24 — R6. /fg-review verificación final: el HIGH del global CERRADO y verificado en vivo →
  cambio CERRADO con `verdict: approved`.** El dev autorizó cerrar el global ahora (camino A de R5). Se
  aplicó `access.read`/`access.update` en `SitioSabrina.ts:62-69`, ambos = `esEditorDeSabrina(req)`:
  super_admin siempre pasa; un `tenant_editor` pasa solo si su `clienta` coincide con la clienta dueña,
  resuelta por slug "sabrina" (constante `SLUG_CLIENTA_SABRINA`, sin id hardcodeado) vía
  `req.payload.find(overrideAccess:true)`; cualquier otro caso retorna false (falla CERRADO si la
  clienta no existe). El security-reviewer confirmó con replay determinista de las 13 ramas del threat
  model contra el dato real de la DB (slug sabrina → id 1) + smoke en vivo:
  - HIGH cerrado: editor de otra clienta (num/objeto), editor sin clienta, anónimo, y lookup vacío →
    todos `false` para read y update.
  - Flujo legítimo intacto: super_admin read/update OK; editor de Sabrina (id 1, en sus 4 formas) OK;
    comparación `String(userClientaId) === String(clientaSabrinaId)` robusta frente a int/string y a
    `user.clienta` objeto vs escalar.
  - Endpoint público `GET /api/sitios/sabrina` → 200 EN VIVO (usa Local API con overrideAccess, no lo
    afecta el access del global). Contrato del DTO intacto.
  - Sin vector nuevo CRITICAL/HIGH; matriz D6 de colecciones/fields no tocada (solo se agregó la
    función de access del global, sin DDL). Único remanente: LOW de performance (el `find` corre en
    cada check de read/update del global) — aceptable en Fase 2 (lookup indexado por `slug` unique,
    panel de baja frecuencia, endpoint público no pasa por ahí); se resuelve con el modelo multi-tenant
    nativo de Fase 3 ya anotado en D7.
  Gates de cierre finales TODOS verdes: `pnpm -r typecheck` PASS, `pnpm -r lint` PASS, `pnpm build`
  PASS, `pnpm audit` 0 critical/0 high (3 low + 14 moderate, transitivas del panel/tooling, sin
  cambios). **Estado del cambio: CERRADO.**
  Higiene de la base de dev (no afecta el cierre, recomendación al dev): los smoke en vivo de los
  reintentos dejaron en la base de dev `axs_cms` una clienta de prueba `FakeClienta` (id 3, slug
  `fake-clienta`, sin editor) y un usuario `tenant_editor` de Sabrina (id 2, con password reseteado a
  un valor aleatorio desconocido por el reviewer de R5). No afectan seguridad ni el flujo legítimo,
  pero conviene depurarlos manualmente para dejar la base de dev limpia. /fg-review NO los borra:
  modificar datos de la base de dev compartida es una acción destructiva que decide el dev.
