# Arquitectura — Plataforma Axs

## Problema y proposito

Axs vende sitios web por suscripcion a clientas independientes (influencers, restaurantes, etc.), en dos planes: generico (molde por rubro) y a medida (diseno propio). El problema central es que cada clienta necesita poder editar su propio contenido (textos, precios, fotos) y elegir entre opciones ya disenadas (variantes de seccion, orden, paleta) sin depender de Axs para cada cambio. Disenar esas opciones es trabajo de Axs. El modelo de negocio esta en `docs/modelo-de-negocio.md`.

La solucion es un **CMS headless compartido** que gestiona el contenido de todas las clientas en una sola base de datos y lo sirve por API con DTOs tipados. Cada clienta tiene su **sitio a medida** que consume esa API y renderiza el contenido con su diseno propio.

## Usuarios

- **Clientas (tenant_editor):** editan su propio contenido desde el panel de Payload. Ven solo lo suyo. No tocan codigo.
- **Axs (super_admin):** gestiona el sistema, onboarding de clientas, mantenimientos, pagos.
- **Visitantes del sitio:** consumen el sitio frontend de cada clienta; nunca interactuan con el CMS directamente.

## Estructura del monorepo

```
axs-platform/                        (pnpm workspaces)
├── apps/
│   └── cms/                         Motor compartido — Payload 3.x + PostgreSQL
│       ├── payload.config.ts        Config raiz del CMS
│       ├── src/collections/         Clientas, Usuarios, Medios
│       ├── src/globals/             SitioSabrina (contenido del sitio, 13 bloques)
│       ├── src/app/api/sitios/      Endpoint custom que ensambla el DTO
│       ├── src/access/              Access control por tenant
│       └── src/seed/               Seed inicial desde fixtures
├── sites/
│   └── influencers/
│       └── sabrina/                 Primer sitio a medida (Next 16 App Router)
│           └── app/page.tsx         Consume obtenerSitioSabrina(); no cambia cuando cambia el CMS
├── packages/
│   └── cms-client/                  Capa fina compartida: fetch + tipos de DTO
│       ├── src/cliente.ts           obtenerSitioSabrina() — fetch al endpoint + parse Zod
│       ├── src/esquemas.ts          SitioSabrinaSchema — fuente unica de verdad del DTO
│       ├── src/tipos.ts             Tipos TS inferidos del schema
│       └── src/fixtures/sabrina.ts  Contenido de referencia (fuente del seed; no se usa en runtime)
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Flujo de datos

```
sites/influencers/sabrina/app/page.tsx
  └── await obtenerSitioSabrina()              [packages/cms-client]
        └── fetch GET /api/sitios/sabrina      [apps/cms — ruta custom Next App Router]
              └── Payload Local API
                    └── Global sitio-sabrina   [13 bloques tipados en PostgreSQL]
```

El sitio nunca conoce el modelo del CMS: solo recibe el DTO `SitioSabrina` ya ensamblado. `cms-client` valida la respuesta con `SitioSabrinaSchema.parse()` en el borde; si el CMS devuelve una forma invalida, falla antes de que el dato llegue al renderizado.

## Modelo de datos (Fase 1)

Colecciones activas en Payload sobre PostgreSQL:

| Coleccion / Global | Rol | Notas |
|---|---|---|
| `clientas` | Tenants del sistema | `slug` unique, `dominio?`, `theme?` (tokens JSON), `estaActiva` |
| `usuarios` | Auth del panel | Roles: `super_admin` (Axs) o `tenant_editor` (clienta). FK a `clientas`. |
| `medios` | Upload collection | `textoAlternativo`, relacion a `clientas`. La clienta sube sus fotos desde el panel (JPG, PNG, WebP o AVIF, hasta 10 MB; SVG no). Archivos publicos en `/api/medios/file/<archivo>`; en el panel cada editora ve solo los suyos. Una foto en uso en el sitio no se puede borrar. Desde 2026-11-23. |
| Global `sitio-sabrina` | Contenido del sitio | 13 bloques que espejan 1:1 `SitioSabrinaSchema`. Singleton por instalacion. Las imagenes son campos upload a `medios`; el endpoint las convierte a `{ url, textoAlternativo, ancho, alto }`. |

Colecciones previstas en `docs/esquema.sql`, a implementar en Fase 2:
`suscripciones`, `mantenimientos`, `pagos`.

## El contrato DTO

`packages/cms-client/src/esquemas.ts` define `SitioSabrinaSchema` (Zod). Es la **fuente unica de verdad** del DTO. El CMS no define su propia forma; se adapta al contrato existente. El DTO tiene 13 secciones: `config`, `hero` (con `escenas[]` min 1), `sobreMi`, `proposito`, `pilares`, `pack`, `comoTrabajo`, `experiencias`, `testimonios`, `marcas`, `faq`, `contacto`, `redes`.

## Restricciones del sistema

- **Contenido nunca hardcodeado:** todo el contenido visible del sitio viaja por la API. Si algo obliga a hardcodear en un componente, es un defecto de arquitectura.
- **Firma de `obtenerSitioSabrina()` estable:** el sitio no cambia cuando cambia el CMS. El contrato Zod es el punto de desacoplamiento.
- **Multi-tenant con aislamiento por access control de Payload** (Fase 1). Row-Level Security a nivel PostgreSQL esta diferida (opcional en `docs/esquema.sql`).
- **Sin colecciones genericas en runtime:** el panel usa colecciones tipadas, no JSON crudo. Ver ADR-002.

## Estado actual y roadmap

| Fase | Estado | Descripcion |
|---|---|---|
| Fase 1 | Completada (2026-06-22) | CMS levantado, Sabrina como primer tenant, endpoint `/api/sitios/sabrina` funcionando, sitio cableado al fetch real. |
| Fase 2.1 | Completada (2026-06-24) | Baseline de migraciones de produccion y hardening del CMS: authz multi-tenant en colecciones, campos y global; endpoint publico con rate limit y errores sin detalle. Expediente: `docs/auditoria/cambios/2026-06-chore-hardening-cms-deploy/`. |
| Fase 2.2 | En pausa (2026-11-25) | Deploy. Hecho: Dockerfiles multi-stage del CMS y de Sabrina, `compose.local.yaml` para levantar ambos en local. Falta: compose de produccion, VPS + Coolify, dominio. Se retoma como proyecto 7 del roadmap nuevo. |

**Roadmap desde 2026-11-25.** El modelo de negocio cambio (`docs/modelo-de-negocio.md`) y reemplaza a las fases 2.3 y 3 anteriores. Se construye el producto completo y se publica al final.

| # | Proyecto | Estado | Descripcion |
|---|---|---|---|
| 1 | Tests del CMS | Pendiente | La suite que hoy falta, para poder trabajar con test primero. |
| 2 | Biblioteca de secciones | Pendiente | Secciones con variantes, orden, paletas y estilo de animacion; borrador, vista previa y publicacion; el sitio de Sabrina rehecho encima con su diseno. Requiere un ADR nuevo que reemplace al ADR-002. |
| 3 | Molde de marca personal | Pendiente | Catalogo de secciones del rubro, siluetas, limite de lugares. |
| 4 | Suscripciones y cobros | Pendiente | Planes, extras, cupones, cobro automatico y por transferencia, secuencia de impago, reportes. Las tablas `suscripciones`, `mantenimientos` y `pagos` de `docs/esquema.sql` se revisan. |
| 5 | Alta con vista previa | Pendiente | Formulario, sitio generado, pago, accesos por correo, primeros pasos. |
| 6 | Sitio de Axs | Pendiente | Vidriera con planes y embudo. |
| 7 | Publicacion | Pendiente | Deploy de produccion, subdominios por sitio, dominios propios. Continua `docs/auditoria/cambios/2026-11-chore-deploy-docker/`. |

## Decisiones de arquitectura

Ver `docs/arquitectura/decisions/`:
- ADR-001 — Endpoint custom `/api/sitios/sabrina` vs. API REST nativa de Payload
- ADR-002 — Colecciones/globals tipados vs. modelo generico `tipos_seccion` + `secciones` JSON
- ADR-003 — Versiones pineadas de Payload y gestion de peers
