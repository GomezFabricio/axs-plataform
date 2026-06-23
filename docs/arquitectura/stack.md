# Stack — Plataforma Axs

Stack **cerrado**: no se cambia sin discusion explicita y ADR.

## Lenguaje y framework

| Capa | Tecnologia | Version | Notas |
|---|---|---|---|
| CMS (`apps/cms`) | Next.js App Router + TypeScript | `16.2.9` / `6.0.3` | Payload 3.x es Next-native; se monta en el App Router via `@payloadcms/next` |
| Sitios (`sites/`) | Next.js App Router + TypeScript | `16.2.9` / `6.0.3` | TypeScript estricto |
| CMS headless | Payload | `3.85.1` | Core del CMS; panel de admin, auth, colecciones, globals, Local API |
| Adaptador DB | `@payloadcms/db-postgres` | `3.85.1` | Genera columnas snake_case; corre sobre PostgreSQL |
| Rich text | `@payloadcms/richtext-lexical` | `3.85.1` | Peer que Payload espera para campos de texto enriquecido |
| UI Payload | `@payloadcms/ui` | `3.85.1` | Dependencia directa de `apps/cms` (Turbopack la importa directamente en el layout generado) |
| GraphQL | `graphql` | `16.14.2` | Peer de Payload — debe ser 16.x, NO 17.x (ver ADR-003) |
| React | react / react-dom | `19.2.7` | Mismo pin en CMS y sitios |

## Base de datos

| Componente | Tecnologia | Notas |
|---|---|---|
| Motor | PostgreSQL | `postgres:17.5` (imagen pineada en `docker-compose.yml`) |
| ORM / acceso | Payload Local API + `@payloadcms/db-postgres` | Las colecciones se definen en Payload config; el adaptador genera el DDL |
| Migraciones | `payload migrate:create` | En Fase 1 (dev) se usa `push:true`; en produccion debe usarse `push:false` + migraciones generadas (pendiente Fase 2) |

## Frontend de los sitios

| Tecnologia | Uso |
|---|---|
| Tailwind CSS | Estilos; tokens como CSS variables |
| Framer Motion | Motion: `whileInView`, `useScroll`, `useTransform`. Solo `transform`/`opacity` animados. `useReducedMotion()` obligatorio. |
| Lenis | Smooth scroll. Envuelve la app. |

NO usar: canvas scrubbing, frame-sequence, otras librerias de animacion.

## Validacion y tipado

| Tecnologia | Uso |
|---|---|
| Zod | `SitioSabrinaSchema` en `packages/cms-client/src/esquemas.ts` — fuente unica de verdad del DTO. Obligatorio en endpoints custom de pagos/mantenimientos (Fase 2). |
| TypeScript autogenerado de Payload | `apps/cms/src/payload-types.ts` — generado por `payload generate:types`. Usar estos tipos en el endpoint. |

## Gestion de paquetes

| Aspecto | Regla |
|---|---|
| Gestor | `pnpm`. Nunca `npm`. |
| Versiones | Pineadas exactas (`save-exact=true` en `.npmrc`). Sin `^` ni `~`. |
| Lockfile | `pnpm-lock.yaml` commiteado. |
| Vetting | `pnpm audit` en CI. Revisar cada dependencia nueva antes de sumarla. |
| Workspaces | `pnpm-workspace.yaml` con globs `apps/*`, `sites/**`, `packages/*`. |

## Dependencias clave de `apps/cms`

```
payload                       3.85.1
@payloadcms/next              3.85.1
@payloadcms/db-postgres       3.85.1
@payloadcms/richtext-lexical  3.85.1
@payloadcms/ui                3.85.1
graphql                       16.14.2   (NO 17.x — peer constraint de @payloadcms/next)
next                          16.2.9
react / react-dom             19.2.7
sharp                         0.35.2
```

Ver ADR-003 para la razon de `graphql@16.14.2` y la estrategia de vetting.

## Vulnerabilidades conocidas (audit — 2026-06-22)

17 vulnerabilidades transitivas: 3 low + 14 moderate, 0 critical/high. Todas del panel de admin de Payload (`dompurify` via `@monaco-editor`, `esbuild` via `drizzle-kit`). La superficie publica (`/api/sitios/sabrina`) no las alcanza. Accion pendiente: actualizar cuando `@payloadcms/ui@3.85.x` publique fix de `dompurify>=3.4.8`.

## Infra (Fase 2 — pendiente)

- Docker multi-stage.
- Coolify sobre VPS Hostinger (auto-deploy desde git, SSL, reverse proxy, Postgres, backups).
- CMS deployado una vez; cada sitio deployado por separado en su dominio.
