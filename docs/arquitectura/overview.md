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
│       ├── src/seed/                Seed inicial desde fixtures
│       ├── vitest.config.ts         Configuracion de los tests
│       └── tests/
│           ├── soporte/             Arnes: bases descartables, fabricas, peticiones sin servidor
│           ├── integracion/         Aislamiento, medios, usuarios, endpoint publico, carga inicial
│           └── unitarios/           Limite de peticiones
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
├── .github/workflows/ci.yml         Typecheck, lint, tests, build del CMS; auditoria en job aparte
├── pnpm-workspace.yaml              Incluye minimumReleaseAge (dos semanas)
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

## Tests y CI

La suite vive en `apps/cms/tests/` y se corre con `pnpm test` desde la raiz. Son 97 tests en 7 archivos y tardan unos 6 segundos. Detalle y razones en ADR-004.

- **Contra un Postgres real.** Al empezar la corrida se crea una base plantilla y se le corren las migraciones reales; cada archivo de test clona su propia base y tiene su propia carpeta de medios. Nunca se toca la base de desarrollo ni `apps/cms/media`.
- **Dos capas.** La API local de Payload con el control de acceso encendido, y los handlers reales de las rutas llamados sin levantar servidor, para lo que solo vive en HTTP (tope de tamano, formatos, alta de usuarios).
- **Que cubre.** Aislamiento entre clientas, escrituras sin sesion, medios, alta de usuarios e inicio de sesion, el endpoint publico comparado contra el contenido de referencia, la carga inicial y las migraciones sobre una base vacia.
- **Que no cubre.** La migracion de una base que ya tiene contenido, el panel en el navegador y el frontend de los sitios.
- **CI.** `.github/workflows/ci.yml` corre typecheck, lint, tests y build del CMS en cada pull request y en cada push a `develop` y `main`. La auditoria de dependencias corre en un job aparte que por ahora informa sin bloquear.

## Restricciones del sistema

- **Contenido nunca hardcodeado:** todo el contenido visible del sitio viaja por la API. Si algo obliga a hardcodear en un componente, es un defecto de arquitectura.
- **Firma de `obtenerSitioSabrina()` estable:** el sitio no cambia cuando cambia el CMS. El contrato Zod es el punto de desacoplamiento.
- **Multi-tenant con aislamiento por access control de Payload** (Fase 1). Row-Level Security a nivel PostgreSQL esta diferida (opcional en `docs/esquema.sql`).
- **Sin colecciones genericas en runtime:** el panel usa colecciones tipadas, no JSON crudo. Ver ADR-002.
- **Test primero.** Desde 2026-11-25 todo cambio del CMS se hace con test primero. Los tests describen comportamiento y no nombran roles: los nombres de rol aparecen solo en `apps/cms/tests/soporte/fabricas.ts`.
- **Formatos de imagen.** La lista de formatos permitidos de `Medios` es la unica barrera contra archivos no validos (SVG, archivos disfrazados). No se quita ni se amplia sin revisar ese punto.
- **Dependencias.** Versiones exactas y con al menos dos semanas de publicadas.

## Estado actual y roadmap

| Fase | Estado | Descripcion |
|---|---|---|
| Fase 1 | Completada (2026-06-22) | CMS levantado, Sabrina como primer tenant, endpoint `/api/sitios/sabrina` funcionando, sitio cableado al fetch real. |
| Fase 2.1 | Completada (2026-06-24) | Baseline de migraciones de produccion y hardening del CMS: authz multi-tenant en colecciones, campos y global; endpoint publico con rate limit y errores sin detalle. Expediente: `docs/auditoria/cambios/2026-06-chore-hardening-cms-deploy/`. |
| Fase 2.2 | En pausa (2026-11-25) | Deploy. Hecho: Dockerfiles multi-stage del CMS y de Sabrina, `compose.local.yaml` para levantar ambos en local. Falta: compose de produccion, VPS + Coolify, dominio. Se retoma como proyecto 8 del roadmap nuevo. |

**Roadmap desde 2026-11-25.** El modelo de negocio cambio (`docs/modelo-de-negocio.md`) y reemplaza a las fases 2.3 y 3 anteriores. Se construye el producto completo y se publica al final.

| # | Proyecto | Estado | Descripcion |
|---|---|---|---|
| 1 | Tests del CMS | Completado (2026-11-25) | Suite de 97 tests contra Postgres real, CI y test primero encendido. Expediente: `docs/auditoria/cambios/2026-11-test-cms-suite/`. CI en verde en GitHub; en revision en el PR #2. |
| 2 | Perfiles y permisos | Pendiente | Motor de permisos (permiso, perfil, varios perfiles por usuario) en lugar de los roles fijos `super_admin` y `tenant_editor`. El aislamiento por clienta se mantiene aparte. |
| 3 | Biblioteca de secciones | Pendiente | Secciones con variantes, orden, paletas y estilo de animacion; borrador, vista previa y publicacion; el sitio de Sabrina rehecho encima con su diseno. Requiere un ADR nuevo que reemplace al ADR-002. |
| 4 | Molde de marca personal | Pendiente | Catalogo de secciones del rubro, siluetas, limite de lugares. |
| 5 | Suscripciones y cobros | Pendiente | Planes, extras, cupones, cobro automatico y por transferencia, secuencia de impago, reportes. Las tablas `suscripciones`, `mantenimientos` y `pagos` de `docs/esquema.sql` se revisan. |
| 6 | Alta con vista previa | Pendiente | Formulario, sitio generado, pago, accesos por correo, primeros pasos. |
| 7 | Sitio de Axs | Pendiente | Vidriera con planes y embudo. |
| 8 | Publicacion | Pendiente | Deploy de produccion, subdominios por sitio, dominios propios. Continua `docs/auditoria/cambios/2026-11-chore-deploy-docker/`. |

Antes del proyecto 2 va un cambio corto, `chore: actualizar dependencias`: la auditoria reporta 140 vulnerabilidades previas, 9 criticas, en `next` y `payload`. Al cerrarlo, el job de auditoria del CI pasa a bloquear.

Regla transversal: las decisiones de negocio (precios, plazos, limites) son parametros editables desde el panel de Axs; cada proyecto declara los suyos.

## Decisiones de arquitectura

Ver `docs/arquitectura/decisions/`:
- ADR-001 — Endpoint custom `/api/sitios/sabrina` vs. API REST nativa de Payload
- ADR-002 — Colecciones/globals tipados vs. modelo generico `tipos_seccion` + `secciones` JSON
- ADR-003 — Versiones pineadas de Payload y gestion de peers
- ADR-004 — Tests de integracion contra un Postgres real, con una base por archivo
