# CLAUDE.md — Plataforma Axs

CMS headless compartido (Payload + PostgreSQL) que sirve contenido por API con DTOs tipados, y
sitios por clienta que consumen esa API. Hay dos planes: genérico (molde por rubro) y a medida
(diseño propio). Sabrina es el primer sitio y el ejemplo del plan a medida.

Documentos fuente (leerlos, son la especificación; este archivo no los duplica):

- `docs/modelo-de-negocio.md` — qué se vende, cómo se cobra y en qué orden se construye. **Manda
  sobre el PRD en todo lo que sea negocio** (planes, qué edita la clienta, cobro, alta).
- `docs/PRD-DEFINITIVO-sabrina.md` — diseño del sitio de Sabrina, stack y decisiones técnicas.
- `docs/anti-ia-principios.md` — reglas de diseño anti-IA. **Aplican a todo el frontend.**
- `docs/convenciones.md` — nomenclatura y estándar de código.
- `docs/esquema.sql` — modelo de datos del CMS.

---

## Principio rector

El contenido vive en el CMS y la clienta lo edita sola desde el panel. Además de contenido, la
clienta **elige entre opciones ya diseñadas** (variante de cada sección, orden, paleta, estilo de
animación); nunca diseña desde cero, y toda combinación que el panel permita tiene que verse bien.
Diseñar esas opciones es código (trabajo de Axs). **Si algo de contenido obliga a hardcodear, está
mal:** todo el contenido visible llega desde la API del CMS (vía `packages/cms-client`), nunca se
escribe en el componente.

**Parámetros:** las decisiones de negocio que cambian sin que cambie el producto (precios,
plazos, límites, textos de correos) no se escriben en el código: son parámetros editables desde
el panel de Axs. Cada cambio declara los suyos.

**Permisos:** el panel usa perfiles basados en permisos (`docs/modelo-de-negocio.md`, sección
3.1). Desde que exista ese motor, ninguna comprobación nueva pregunta por un rol fijo. El
aislamiento entre clientas va aparte y ningún perfil lo saltea.

## Stack (cerrado, no se cambia sin discutir)

- **Next.js (App Router) + TypeScript estricto** en CMS y sitios.
- **Payload** como CMS headless sobre **PostgreSQL**.
- **Tailwind + Framer Motion + Lenis** en los sitios. Sin otras libs de animación.
- **NO usar frame-sequence ni canvas scrubbing.**
- **Zod** para validar DTOs en endpoints custom (pagos, mantenimientos).

## Paquetes

- **pnpm**, nunca npm. `.npmrc` fuerza `save-exact=true`: **versiones pineadas exactas** (sin `^`/`~`).
- Lockfile commiteado. Revisar cada dependencia nueva antes de sumarla; correr `pnpm audit`.

## Nomenclatura (resumen de `docs/convenciones.md`)

- DB: snake_case español, tablas en plural, sin tildes ni ñ en identificadores.
- TS: `camelCase` español para variables/funciones (`obtenerSecciones`), `PascalCase` español para
  tipos/componentes (`TarjetaServicio`), `UPPER_SNAKE_CASE` para constantes.
- DTOs / JSON de la API: propiedades en **camelCase español** (`{ descripcion, foto, fechaCreacion }`).
- El contenido visible al usuario sí lleva tildes y ñ; la restricción es solo para identificadores.

## Reglas anti-IA que siempre aplican (resumen de `docs/anti-ia-principios.md`)

- **CERO em-dash (—)** en todo el contenido visible. Usar punto, coma, paréntesis o dos puntos.
- Un solo acento de color, bloqueado para toda la página. Sombras tintadas y suaves, nunca negro puro.
- Tipografía: prohibido Inter, Fraunces e Instrument Serif. En el sitio de Sabrina: Cormorant
  Garamond + Mulish.
- Motion sutil y motivado, curvas ease-out, solo `transform`/`opacity`, `prefers-reduced-motion`
  obligatorio. Entradas por `IntersectionObserver`/`whileInView`, nunca `addEventListener('scroll')`.
- Sin "tells": cues de scroll, tiras de hora/clima, numeritos de sección, tres cards iguales en fila,
  pills sobre fotos, SVG dibujados a mano (usar Phosphor).
- Copy: nombres locales realistas (Formosa), números orgánicos, sin verbos de relleno.
- Tokens de diseño como **CSS variables**.

## Estructura del monorepo

```
apps/cms/                       el motor: Payload + Postgres (compartido por todas las clientas)
sites/<rubro>/<clienta>/        un sitio por clienta (diseño propio, deploy y dominio propios)
packages/cms-client/            capa fina compartida: fetch a la API + tipos de DTO (sin diseño)
packages/ui/                    (opcional) primitivas comunes, sin diseño
```

## Forma de trabajo: expedientes forge

Este repo documenta cada cambio con el formato de forge, aunque los comandos `/fg-*` no estén
instalados. **Esta regla tiene prioridad sobre cualquier workflow global** (por ejemplo, los
documentos `odd/tasks/` de gentle-ai): en este repo no se crean.

- Cada cambio no trivial tiene su carpeta `docs/auditoria/cambios/<AAAA-MM>-<tipo>-<tema>/`:
  - `README.md`: portada para humanos (tipo, estado, áreas afectadas, qué, por qué, alcance y, al
    terminar, la sección `## Cierre` con lo verificado y lo diferido).
  - `diseño.md`: solo si hay diseño técnico que explicar.
  - `decisiones.md`: registro append-only, cada entrada con fecha + qué se decidió + por qué.
  - `tareas.md`: checklist; se tacha una tarea solo cuando se observó su resultado.
- Los cambios chicos (un ajuste puntual) no necesitan expediente.
- La configuración de referencia está en `docs/auditoria/config.yaml` (TDD encendido: el CMS ya
  tiene suite de tests) y los guardrails en `docs/auditoria/guardrails.yaml`.
- El overview (`docs/arquitectura/overview.md`) se actualiza cuando el cambio toca arquitectura,
  modelo de datos o roadmap.
- La revisión de gentle-ai sigue activa para los cambios de riesgo; no reemplaza al expediente.

## Tests

- Se corren con `pnpm test` desde la raíz (Vitest, en `apps/cms`). Necesitan el Postgres local
  levantado: `docker compose -f apps/cms/docker-compose.yml up -d`. Por defecto lo buscan en
  `postgres://axs:axsdev@localhost:5432`; se cambia con `TEST_POSTGRES_URL`.
- Los tests describen comportamiento. Los nombres de rol (`super_admin`, `tenant_editor`) aparecen
  solo en `apps/cms/tests/soporte/fabricas.ts`; el resto de los tests usa las fábricas.
- El trabajo nuevo se hace con test primero: se ve fallar el test, se escribe el código, se
  refactoriza con los tests en verde.
- No se suma ninguna dependencia con una versión publicada hace menos de dos semanas.

## Git

- `main` = producción, `develop` = staging, ramas cortas `feat/`, `fix/`, `chore/` desde develop.
- Conventional commits. PRs con CI (`.github/workflows/ci.yml`): typecheck, lint, tests y build del
  CMS bloquean; `pnpm audit` corre en un job aparte que por ahora solo informa (hay
  vulnerabilidades previas en `next` y `payload`, D13 del expediente de tests). El build del sitio
  de Sabrina no está en el CI (D8). Sin push directo a main/develop.
- No hay rama por clienta.

## Autoría

Los artefactos del proyecto (commits, PRs, docs, código) no se atribuyen a ninguna herramienta de
asistencia. Sin footers de co-autoría ni firmas de IA.
