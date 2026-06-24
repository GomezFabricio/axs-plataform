# Tareas — Hardening del CMS y baseline de migraciones para deploy

**Cambio:** `2026-06-chore-hardening-cms-deploy`

> Checklist mutable. `/fg-implement` marca `[x]` a medida que completa cada tarea.
> TDD off: cada tarea se valida con typecheck + lint + build; las de migración suman una
> verificación manual contra el Postgres dev en Docker; el cierre suma `pnpm audit`.
> Orden: dependencias y schema primero, hardening del endpoint después.

---

## Checklist de tareas

### Frente 1 — Baseline de migraciones

- [x] **T1. Configurar `migrationDir` explícito en `postgresAdapter`** (`payload.config.ts`):
  `migrationDir: path.resolve(__dirname, "src/migrations")`. Sin tocar el flag `push`. Validar
  con `typecheck`.
- [x] **T2. Agregar scripts `migrate*` a `apps/cms/package.json`**: `migrate`, `migrate:create`,
  `migrate:status`, `migrate:fresh`, todos vía el CLI `payload migrate*`. Sin sumar dependencias.
- [x] **T3. Generar la baseline contra una base limpia** (D2): levantar/recrear el Postgres dev
  en Docker vacío, correr `payload migrate:create` con `push` activo y `NODE_ENV` de dev, y
  commitear los archivos generados en `apps/cms/src/migrations/` (la migración `.ts` + `index.ts`
  del directorio). Confirmar que el contenido es solo DDL (no datos del seed).
- [x] **T4. Validar que la baseline reproduce el esquema actual sobre base limpia**: sobre una
  base totalmente vacía, correr `pnpm --filter @axs/cms migrate` (con `push:false` /
  `NODE_ENV=production`) y verificar que el esquema resultante coincide con el de dev (tablas,
  columnas, tipos, FKs, índices, tabla `payload_migrations` registrada). Dejar registro del
  método de verificación en `decisiones.md`.
- [x] **T5. Verificar que el seed sigue desacoplado de la migración**: tras correr solo `migrate`
  (sin seed) la DB tiene el schema vacío de datos; correr `cms:seed` aparte la puebla. Confirmar
  que ni `migrate` invoca el seed ni el seed crea schema.

### Frente 2 — Hardening del endpoint y access control

- [x] **T6. Quitar la fuga de internals del 500** (`route.ts`): logear `error.message`
  server-side y devolver `{ error: "No se pudo obtener el sitio" }` sin `detalle`. Status 500 sin
  cambio.
- [x] **T7. Guard de `hero.escenas` vacío** (`route.ts`): junto a la validación de `config`,
  chequear `hero?.escenas?.length >= 1`; si no, devolver 422 con
  `{ error: "Contenido del sitio incompleto" }`. Confirmar que el 200 con escenas válidas produce
  el DTO idéntico.
- [x] **T8. Restringir el field `rol` a `super_admin`** (`Usuarios.ts`): agregar
  `access.update: ({ req }) => req.user?.rol === "super_admin"` al field `rol`. No tocar
  `accesoPorTenant`.
- [x] **T9. Implementar el rate limiter in-memory** (`src/lib/rateLimit.ts`): ventana fija por
  clave (IP), función pura `consultarRateLimit(clave, ahora?)` que devuelve
  `{ permitido, restantes, reiniciaEn }`. Límite y ventana definidos en D1.
- [x] **T10. Cablear el rate limit en el endpoint** (`route.ts`): derivar la IP de
  `x-forwarded-for` (primer hop) con fallback, consultar el limiter al inicio del handler y, si
  `!permitido`, devolver 429 con header `Retry-After` antes de tocar Payload.

### Re-implementación acotada — Authz multi-tenant (post /fg-review bloqueante R2)

- [x] **T13. Access control en `Clientas.ts`**: `read` filtrado por `id` del tenant (super_admin
  ve todas; tenant_editor solo la suya); `create`/`update`/`delete` solo `super_admin`.
- [x] **T14. Access control en `Medios.ts`**: `read`/`create`/`update`/`delete` con
  `accesoPorTenant` (filtra por field `clienta` del documento, que ya existe en la colección).
- [x] **T15. IDOR fix — field `clienta` en `Usuarios.ts`**: `access.update` a nivel field
  `clienta` que solo permite a `super_admin` reasignar tenant. Mismo criterio que el fix de `rol`.
- [x] **T16. HIGH fix — field `rol.access.create` en `Usuarios.ts`**: `access.create` a nivel
  field `rol` que solo permite a `super_admin` setear `super_admin` al crear. El default
  `tenant_editor` aplica cuando el creador no es super_admin.
- [x] **T17. MEDIUM fix — evicción lazy en `rateLimit.ts`**: `purgarExpirados(ahora)` antes de
  cada consulta, elimina buckets con ventana vencida. API y comportamiento 60/60s sin cambio.
- [x] **T18. Validación de cierre (re-iteración)**: typecheck, lint, build, audit. Smoke: endpoint
  200 con DTO intacto; rate limit sigue respondiendo 429 tras umbral.

### Re-implementación comprehensiva — Cierre de familia de authz (post review reintento 2)

- [x] **T19. `Usuarios.access.create` — colección**: agregar bloque `access.create` a nivel
  colección. Solo super_admin puede crear usuarios. Segunda capa defensiva para Local API.
- [x] **T20. `Usuarios.fields.clienta.access.create` — field**: agregar `access.create` al field
  `clienta` (espeja el `update` ya existente). Cierra la asignación de clienta ajena al crear.
- [x] **T21. `Medios.fields.clienta.access.create/update` — field**: agregar `access.create` y
  `access.update` al field `clienta` en Medios (solo super_admin puede setear/cambiar la clienta
  de un medio). Hook `beforeChange` auto-asigna `req.user.clienta` en create para tenant_editor.
- [x] **T22. `Usuarios.hooks.beforeChange` — barrera primaria de create**: dado que en Payload
  3.x el endpoint de auth registration (`POST /api/usuarios`) bypasea `access.create` y
  `beforeOperation` a nivel colección, se agrega hook `beforeChange` que lanza `APIError(403)`
  si el creador no es super_admin. Verificado que `beforeChange` SÍ es evaluado por el create
  operation de Payload (ver `collections/operations/create.js:123-134`).
- [x] **T23. Auditoría comprehensiva de la matriz de permisos**: verificado los 4 verbos × 3
  colecciones × campos sensibles. Modelo resultante documentado en D6 de decisiones.md.
- [x] **T24. Validación de cierre final**: typecheck, lint, build, audit (4 gates). Smoke:
  endpoint 200 con DTO intacto (verificado). Restricciones de create en dev server pendientes
  de restart del proceso (limitación de hot reload de Payload — ver D6).

### Arreglo final — Global SitioSabrina sin access (autorizado por el dev fuera del budget de reintentos)

- [x] **T25. Access control en `SitioSabrina.ts`**: `read` y `update` restringidos a `super_admin`
  o al `tenant_editor` de la clienta dueña del sitio (resuelta por slug `"sabrina"` via Local API,
  sin hardcodear el id). El endpoint público `/api/sitios/sabrina` usa Local API con
  `overrideAccess` (default de Payload) y NO se ve afectado. Deuda Fase 3 documentada en D7:
  el modelo correcto multi-tenant (global/colección por tenant) queda pendiente.
- [x] **T26. Validación de cierre final**: typecheck EXIT 0, lint EXIT 0, build EXIT 0, audit EXIT 0
  (0 critical/high). Smoke verificado: super_admin lee/actualiza global (200); editor de Sabrina
  lee/actualiza global (200); endpoint público `/api/sitios/sabrina` (200 con DTO intacto).

### Cierre

- [x] **T11. Validación de cierre**: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`,
  `pnpm audit` (sin critical/high nuevos). Smoke manual: (a) `super_admin` puede cambiar roles;
  (b) endpoint responde 200 con contenido válido, 422 con escenas vacías, 429 al exceder el
  límite, 500 sin `detalle`.
- [x] **T12. Documentar el cableado de `migrate` en deploy/CI** (no implementar la infra): dejar
  en `diseño.md`/README la nota de que `pnpm --filter @axs/cms migrate` corre antes de `start` en
  producción, como entregable listo para el incremento de deploy.
