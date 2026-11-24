# CLAUDE.md — Plataforma Axs

CMS headless compartido (Payload + PostgreSQL) que sirve contenido por API con DTOs tipados, y
sitios a medida por clienta que consumen esa API y la renderizan con su diseño propio. Sabrina es
el primer sitio.

Documentos fuente (leerlos, son la especificación; este archivo no los duplica):

- `docs/PRD-DEFINITIVO-sabrina.md` — qué se construye y por qué (fuente única de verdad).
- `docs/anti-ia-principios.md` — reglas de diseño anti-IA. **Aplican a todo el frontend.**
- `docs/convenciones.md` — nomenclatura y estándar de código.
- `docs/esquema.sql` — modelo de datos del CMS.

---

## Principio rector

El contenido vive en el CMS y la clienta lo edita sola desde el panel. El diseño y la estructura
son código del sitio (trabajo de Axs). **Si algo de contenido obliga a hardcodear, está mal:**
todo el contenido visible llega desde la API del CMS (vía `packages/cms-client`), nunca se escribe
en el componente.

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
- Tipografía: prohibido Inter, Fraunces e Instrument Serif. Acá: Cormorant Garamond + Mulish.
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
- La configuración de referencia está en `docs/auditoria/config.yaml` (TDD apagado hasta que haya
  suite de tests) y los guardrails en `docs/auditoria/guardrails.yaml`.
- El overview (`docs/arquitectura/overview.md`) se actualiza cuando el cambio toca arquitectura,
  modelo de datos o roadmap.
- La revisión de gentle-ai sigue activa para los cambios de riesgo; no reemplaza al expediente.

## Git

- `main` = producción, `develop` = staging, ramas cortas `feat/`, `fix/`, `chore/` desde develop.
- Conventional commits. PRs con CI (typecheck, lint, build, `pnpm audit`). Sin push directo a main/develop.
- No hay rama por clienta.

## Autoría

Los artefactos del proyecto (commits, PRs, docs, código) no se atribuyen a ninguna herramienta de
asistencia. Sin footers de co-autoría ni firmas de IA.
