# Decisiones — CMS headless de la Plataforma Axs sirviendo a Sabrina

**Cambio:** `2026-06-feat-cms-headless-sabrina`

> Registro append-only. Cada decisión: fecha (YYYY-MM-DD) + qué se decidió + por qué. Nunca se
> sobrescribe; `/fg-implement` agrega al final las decisiones que surjan en el código.

---

- **2026-06-22 — Endpoint: ruta custom `/api/sitios/sabrina` que ensambla el DTO agregado.**
  Se descarta exponer el DTO vía la API REST/GraphQL nativa de Payload por colección. Razón: el
  contrato `SitioSabrina` es un agregado de 13 secciones bajo una raíz; reconstruirlo del lado
  del cliente obligaría a `cms-client` a hacer múltiples fetches y a conocer el modelo interno del
  CMS, rompiendo la "capa fina". El ensamblado pertenece al CMS, donde vive el conocimiento del
  modelo. Además, el contrato ya dejó preparada esta ruta: el comentario en
  `packages/cms-client/src/cliente.ts` apunta explícitamente a `${baseUrl}/api/sitios/sabrina`.
  La ruta custom lee las colecciones del tenant Sabrina vía la Local API de Payload y devuelve el
  DTO ya compuesto, validado en el borde del cliente con `SitioSabrinaSchema.parse()`.

- **2026-06-22 — Modelado: colecciones/globals tipados de Payload, no el modelo genérico
  `tipos_seccion` + `secciones` (JSON) de `esquema.sql`.**
  `docs/esquema.sql` propone un modelo genérico donde `tipos_seccion` define el contrato como JSON
  y `secciones.datos` guarda instancias en `jsonb`. Se opta por colecciones/globals tipados.
  Razones: (1) el propio `esquema.sql` aclara que "con Payload estas tablas se generan desde la
  config; esto documenta la forma esperada" — es un modelo de referencia, no un mandato de
  implementación; (2) `docs/convenciones.md` (sección Payload) indica usar los tipos TS que
  Payload autogenera y nombrar campos en camelCase español para que la API quede en camelCase y el
  adaptador genere columnas snake_case; (3) los campos tipados dan panel de edición por
  formularios, validación y tipos gratis, mientras que el modelo genérico exigiría editar JSON
  crudo o construir un form-builder dinámico — trabajo que Payload ya resuelve. El tradeoff que
  ofrece el modelo genérico (agregar tipos de sección nuevos en runtime sin tocar código) no es
  necesario en Fase 1: el sitio de Sabrina consume un DTO fijo y conocido. Esa flexibilidad es un
  problema de Fase 3 (onboarding de clientas con secciones distintas) y se reevaluará entonces.
  En concreto, el contenido del DTO se modela como un Global/singleton `sitioSabrina` por tenant
  con los 13 bloques como `group`/`array` fields que espejan 1:1 las 13 partes de
  `SitioSabrinaSchema`; `medios` es una upload collection que mapea `MedioSchema`.

- **2026-06-22 — Versiones pineadas de Payload y su stack (`save-exact=true`).**
  Se pinean exactas: `payload@3.85.1`, `@payloadcms/next@3.85.1`, `@payloadcms/db-postgres@3.85.1`,
  `@payloadcms/richtext-lexical@3.85.1`, `sharp@0.35.2`, alineadas con el `latest` estable
  verificado en el registry. Gotcha registrada: `@payloadcms/next@3.85.1` declara peer
  `graphql ^16.8.1`; el registry sirve `graphql@17.0.1` como `latest`, que **rompe** la resolución
  de peers. Por eso se pinea `graphql@16.14.2` (último 16.x), no 17.x. `@payloadcms/next@3.85.1`
  exige Next `>=16.2.6 <17` y el repo ya está en `next@16.2.9` / `react@19.2.7` / `react-dom@19.2.7`;
  el CMS pinea exactamente esas mismas versiones para evitar duplicados en el store de pnpm. Con
  `auto-install-peers=true` + `save-exact=true`, las deps directas quedan pineadas; se revisa el
  diff del lockfile y se corre `pnpm audit` antes de commitear (vetting de cadena de suministro,
  PRD sección 8). Nota: Context7 no estuvo disponible en esta fase; las versiones se resolvieron
  contra el registry de npm (`npm view`), incluida la verificación de peers.

- **2026-06-22 — Proyecto no legacy: se omite el análisis de impacto (`legacy-impact-analyzer`).**
  El monorepo es greenfield para este incremento: `apps/cms` no existe aún y no hay CMS previo que
  pueda romperse. El único consumidor del contrato (`obtenerSitioSabrina`) se preserva con firma y
  tipo de retorno intactos (verificado con CodeGraph: blast radius = `sites/influencers/sabrina/app/page.tsx`
  + re-export en `cms-client/src/index.ts`). No se invocó el sub-agente de impacto legacy.

- **2026-06-22 — Alcance del modelo en Fase 1.** Se modelan solo `clientas`, `usuarios`, `medios`
  y el contenido del sitio de Sabrina. Quedan fuera `suscripciones`, `mantenimientos`, `pagos`
  (Fase 2) y Row-Level Security a nivel base (opcional en el esquema; el access control de Payload
  por tenant es el mínimo de este incremento).

- **2026-06-22 — Variable de entorno `CMS_URL` (server-side) como fuente principal de la URL del CMS.**
  `obtenerSitioSabrina()` en `packages/cms-client/src/cliente.ts` usa `process.env.CMS_URL` como
  primera prioridad, con fallback a `process.env.NEXT_PUBLIC_CMS_URL` y finalmente
  `http://localhost:3001`. Se eligió `CMS_URL` (sin prefijo `NEXT_PUBLIC_`) porque el fetch se
  realiza en Server Components; la URL del CMS interno no debe exponerse al browser. La variable
  se documenta en `sites/influencers/sabrina/.env.example`. Para desarrollo local, el CMS corre en
  `:3001` por defecto (ver `apps/cms/package.json` `dev` script y `docker-compose.yml`).

- **2026-06-22 — `imagen` modelada inline en el global `sitioSabrina`, no como relación a `medios`.**
  La spec original del bloque B indicaba `imagen` como relación a la colección `medios`. En la
  implementación se optó por modelar `imagen` como un grupo inline (`imagen_url` +
  `imagen_texto_alternativo`) dentro del global. Razón: en Fase 1 no hay flujo de upload de
  archivos binarios; el seed conserva las URLs de los fixtures tal cual. La colección `medios` existe
  pero no se usa en Fase 1. Si en Fase 2 se incorpora upload real, se migrará a relación. Resultado:
  `medios=0` en la DB es correcto y esperado para Fase 1.

- **2026-06-22 — Imagen de PostgreSQL pineada a `postgres:17.5` en `docker-compose.yml`.**
  Se usa `postgres:17.5` (tag específico de patch) en lugar de `postgres:17` o `postgres:latest`
  para garantizar reproducibilidad del entorno local entre máquinas. Evita sorpresas por updates
  automáticos del daemon de Docker.

- **2026-06-22 — Runner del seed: `payload run src/seed/index.ts` en lugar de `ts-node`.**
  El script `cms:seed` originalmente usaba `node --loader ts-node/esm` pero `ts-node` no está
  instalado (ni se instala para no sumar deps). Payload 3.x incluye el CLI `payload run <script>`
  que ejecuta archivos TypeScript directamente usando el runtime interno de Payload (carga la config,
  conecta a la DB, y corre el script). No requiere deps adicionales. Verificado: `pnpm --filter
  @axs/cms cms:seed` sale con exit 0 e idempotencia confirmada (re-correrlo no duplica datos).
  La DB es accesible vía el `.env` de `apps/cms` que se carga automáticamente.

- **2026-06-22 — Vulnerabilidades del audit: 3 low + 14 moderate, 0 critical/high. No se aplican overrides.**
  `pnpm audit` reporta 17 vulnerabilidades transitivas: `esbuild <=0.24.2` (vía
  `@payloadcms/db-postgres > drizzle-kit > @esbuild-kit`) y múltiples CVEs de `dompurify <=3.4.7`
  (vía `@payloadcms/ui > @monaco-editor/react > monaco-editor`). Todas son del panel de
  administración de Payload, no del path de producción del sitio público. La superficie expuesta al
  usuario final es solo el fetch al endpoint `/api/sitios/sabrina` — ninguna de estas deps llega
  ahí. Se decide NO aplicar overrides agresivos porque (a) rompería la resolución de deps de Payload,
  (b) son del admin panel que solo ven editores autenticados, y (c) Payload publicará fix en la
  próxima versión cuando actualice `@monaco-editor` y `drizzle-kit`. Acción pendiente: revisar si
  `@payloadcms/ui@3.85.x` publica una versión con `dompurify>=3.4.8` y actualizar entonces.

- **2026-06-22 — `@payloadcms/ui@3.85.1` agregada como dependencia directa de `apps/cms`.**
  pnpm no crea symlinks para deps transitivas en proyectos workspace; `@payloadcms/ui` es dep de
  `@payloadcms/next` pero al construir el CMS con Turbopack, el archivo autogenerado
  `src/app/(payload)/layout.tsx` importa `@payloadcms/ui/scss/app.scss` directamente. Sin symlink
  en `apps/cms/node_modules`, el build fallaba con "Module not found". Solución: agregar
  `"@payloadcms/ui": "3.85.1"` a las dependencias directas del CMS (versión pineada exacta,
  coherente con la ya instalada por `@payloadcms/next`). No se suma ninguna dependencia nueva al
  lockfile; solo se expone la ya resuelta.

- **2026-06-22 — `src/app/(payload)/layout.tsx`: `Layout` convertido a función async.**
  El archivo autogenerado por Payload tiene la directiva `"use server"` a nivel de módulo. En
  Next.js 16 con Turbopack (activado por defecto), esta directiva exige que todos los exports del
  módulo sean funciones async. El componente `Layout` originalmente era una arrow function
  sincrónica, lo que causaba "Server Actions must be async functions" en el build. Se convierte a
  `async function Layout(...)` — los Server Components de Next.js pueden ser async sin cambio de
  comportamiento. El build pasa. Si Payload regenera este archivo en una versión futura, aplicar
  el mismo fix.

- **2026-06-22 — Lint de `sites/influencers/sabrina` `Hero.tsx`: `useReducedMotion()` en lugar de `useState + useEffect`.**
  El `HeroMobileCarrusel` usaba `useState(false)` + `useEffect` para detectar `prefers-reduced-motion`,
  patrón que la regla `react-hooks/set-state-in-effect` de ESLint 9 rechaza. Se reemplaza por
  `useReducedMotion()` de Framer Motion (ya importado en el mismo archivo), que es la API correcta
  para este caso y elimina el efecto secundario. Comportamiento idéntico; cero cambio en runtime.

- **2026-06-22 — Cierre del cambio: "cerrado" = Fase 1 en dev. CRITICAL del dba-reviewer (migraciones) → deuda Fase 2.**
  En `/fg-review` el dba-reviewer retornó `verdict: blocking` por un CRITICAL: `apps/cms/src/migrations/`
  vacío y sin script `payload migrate` cableado, con `push:false` en producción. El blocking es condicional
  y acotado a la *promoción a producción*, no al cierre de la Fase 1 en dev (en dev `push` sincroniza el
  esquema y todo funciona). El deploy a prod está fuera de alcance de este incremento (Fase 2, ya declarado
  en el README y en la decisión de alcance del modelo). El dev resolvió cerrar la Fase 1 en dev: el CRITICAL
  pasa a **deuda registrada de Fase 2** (bloqueante para deploy a prod, no para este cierre) y NO se reintenta
  `/fg-implement`. Fix de la deuda: generar baseline (`payload migrate:create`), commitearla, cablear
  `migrate` en deploy/CI, confirmar `push:false` efectivo. El resto de hallazgos de los reviewers (MEDIUM de
  fuga de `error.message` en el 500, WARNING de `hero.escenas` vacío, verificación de auto-elevación de rol,
  índices/FK, creds docker dev, rate limiting) quedan como deuda/hardening según la tabla "Deuda registrada"
  del `README.md`. Validación de cierre confirmada por `/fg-review`: `pnpm -r typecheck/lint/build` PASS,
  `pnpm audit` 0 critical/high. Estado del cambio: `cerrado`.
