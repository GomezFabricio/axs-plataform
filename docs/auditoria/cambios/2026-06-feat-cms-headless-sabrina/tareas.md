# Tareas — CMS headless de la Plataforma Axs sirviendo a Sabrina

**Cambio:** `2026-06-feat-cms-headless-sabrina`
**Modo:** TDD off (no hay test runner). Validación de cierre: typecheck + lint + build + `pnpm audit`.
**Lee el plan:** `diseño.md` (enfoque, arquitectura, mapeo del DTO, versiones pineadas).

> Checklist mutable. `/fg-implement` tacha cada tarea al completarla. Orden: dependencias primero,
> integración después.

## Checklist de tareas

### Bloque A — Scaffolding de `apps/cms` (base de la app)

- [x] Crear `apps/cms` con la estructura de una app Next 16 + Payload 3.x (App Router), entrando al workspace por el glob `apps/*` ya existente.
- [x] Agregar `apps/cms/package.json` con las dependencias de Payload **pineadas exactas**: `payload@3.85.1`, `@payloadcms/next@3.85.1`, `@payloadcms/db-postgres@3.85.1`, `@payloadcms/richtext-lexical@3.85.1`, `graphql@16.14.2` (NO 17.x), `sharp@0.35.2`, `next@16.2.9`, `react@19.2.7`, `react-dom@19.2.7`.
- [x] `pnpm install` + revisar el diff del `pnpm-lock.yaml` + `pnpm audit`: confirmar que no quedan peers sin resolver y que no hay vulnerabilidades críticas (vetting de cadena de suministro).
- [x] Agregar `apps/cms/tsconfig.json` (extends `tsconfig.base.json`, plugin de Next, strict heredado) y `apps/cms/next.config.ts` con `withPayload(...)`.
- [x] Agregar `apps/cms/.env.example` con `DATABASE_URI` (Postgres) y `PAYLOAD_SECRET`; documentar que son requeridas para levantar.

### Bloque B — Modelo de datos (colecciones tipadas)

- [x] Crear `payload.config.ts` raíz: adaptador `db-postgres`, editor lexical, admin, y registro de colecciones/globals. Confirmar que el adaptador genera columnas snake_case desde campos camelCase español.
- [x] Colección `clientas` (tenants): `nombre`, `slug` (unique), `dominio?`, `theme` (json), `estaActiva`. Slug interno snake_case español.
- [x] Colección `usuarios` (auth de Payload): `email`, `rol` (`super_admin` | `tenant_editor`), relación a `clientas`.
- [x] Colección `medios` (upload): mapea `MedioSchema` (`url`, `textoAlternativo`/alt, `ancho`, `alto`), relación al tenant.
- [x] Global/singleton de contenido `sitioSabrina`: los 13 bloques del DTO como `group`/`array` fields tipados, espejando 1:1 `SitioSabrinaSchema`. Respetar `escenas.min(1)`, defaults de `variante` y `destacado`, e `imagen` como relación a `medios`.
- [x] Access control por tenant (`access/porTenant.ts`): `tenant_editor` solo ve/edita lo de su clienta; `super_admin` todo. (RLS a nivel base queda fuera — Fase 2.)
- [x] `pnpm --filter @axs/cms typecheck` y arranque del admin de Payload: verificar que el panel levanta y las colecciones aparecen.

### Bloque C — Seed (fixtures → DB)

- [x] Script de seed `src/seed/sabrina.ts`: crear el tenant `clientas` con `slug: "sabrina"`, sembrar `medios` con las URLs de `public/assets` (conservar las rutas tal cual del fixture, sin subir binarios), y poblar el global `sitioSabrina` con el contenido de `packages/cms-client/src/fixtures/sabrina.ts`.
- [x] Runner del seed (`src/seed/index.ts`) + script en `package.json` (`cms:seed`). Idempotente: re-correrlo no duplica el tenant ni el contenido.
- [x] Correr el seed contra una DB local y verificar en el panel que el contenido de Sabrina quedó cargado (config, hero con 3 escenas, pilares con variantes, testimonios con destacado, etc.).

### Bloque D — Endpoint que produce el DTO

- [x] Ruta custom `src/app/api/sitios/sabrina/route.ts` (`GET`): leer el contenido del tenant `sabrina` vía la Local API de Payload, ensamblar el objeto con la forma de `SitioSabrinaSchema` (mapear `medios` → `MedioSchema`), devolver JSON.
- [x] Manejo de errores del endpoint: tenant inexistente o contenido incompleto → status de error claro (4xx/5xx) para que `cms-client` lance `ErrorCms`.
- [x] Verificación manual: `GET /api/sitios/sabrina` devuelve un JSON que, pasado por `SitioSabrinaSchema.parse()`, no lanza — y reproduce el contenido del fixture (incluida la paridad de defaults y los `\n` de los títulos del hero).

### Bloque E — Cableado del fetch real en `cms-client`

- [x] Modificar el cuerpo de `obtenerSitioSabrina()` en `packages/cms-client/src/cliente.ts`: leer base URL de entorno (preferir `CMS_URL` server-side), `fetch(\`${baseUrl}/api/sitios/sabrina\`, { next: { revalidate: 60 } })`, lanzar `ErrorCms(res.status, ...)` ante `!res.ok`, y `SitioSabrinaSchema.parse(await res.json())`. **NO cambiar la firma ni el tipo de retorno** (`OpcionesCliente`, `Promise<SitioSabrina>`).
- [x] Confirmar que `fixtures/sabrina.ts` deja de ser la fuente en runtime (ya no lo importa `cliente.ts`) pero se conserva como fuente del seed.
- [x] `pnpm --filter @axs/cms-client typecheck`: el contrato sigue compilando, firma intacta.

### Bloque F — Integración y validación de cierre

- [x] Verificar que `sites/influencers/sabrina/app/page.tsx` **no requirió cambios** (firma preservada) y que el sitio levanta contra el CMS local, renderizando el mismo contenido que con el fixture.
- [x] Documentar en `.env.example` del sitio la variable de base URL del CMS que consume el fetch real.
- [x] Validación de cierre del proyecto: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`, `pnpm audit` sin críticas.
- [x] Anotar en `decisiones.md` cualquier decisión que haya surgido durante la implementación (nombre final de la env var, estructura exacta del scaffolding de Payload, etc.) — append-only.

---

> Al cerrar, por ser cambio estructural, `/fg-review` debería sugerir `/fg-update-arch` para
> derivar `docs/arquitectura/overview.md` del PRD y documentar el motor `apps/cms`.
