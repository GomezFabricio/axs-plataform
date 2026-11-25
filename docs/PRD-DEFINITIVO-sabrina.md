# PRD Definitivo — Plataforma Axs (CMS compartido + sitios a medida)

*Fuente única de verdad para Claude Code.*

> **Nota (2026-11-25):** la parte de negocio de este documento quedó reemplazada por
> `docs/modelo-de-negocio.md`: los planes, qué puede editar la clienta, mantenimientos, cobro y
> alta de clientas. Este PRD sigue valiendo para el diseño del sitio de Sabrina, el stack y las
> convenciones. Si los dos documentos se contradicen, manda el modelo de negocio.

> **El modelo:** un **CMS headless compartido** gestiona el contenido de todas las clientas en una base de datos y lo sirve por **API (con DTOs)**. Cada clienta tiene su **sitio propio y único**, diseñado a medida, que consume esa API y **renderiza el contenido como quiera**. Sabrina es el primer sitio.
>
> **El límite:** la clienta edita **contenido** (textos, descripciones, precios, fotos) desde el panel; la **estructura y el diseño** son código a medida (trabajo de Axs, el "cambio estructural" del mantenimiento).

---

## 0. El modelo en una imagen

```
        ┌───────────────────────────────┐
        │     EL SISTEMA / CMS           │
        │  Payload + DB + panel + API    │  ← cada clienta edita SU contenido acá
        │  (multi-tenant, una vez)       │
        └───────────────┬───────────────┘
                        │ API + DTOs (el contenido de cada tenant)
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   sitio Sabrina    sitio cliente-2   sitio cliente-3
   diseño único     diseño único      diseño único      ← frontends independientes
```

Lo compartido es **el sistema** (CMS, panel, API, infra). Lo único por clienta es **el sitio** (diseño + frontend).

**Cómo usar el handoff de Claude Design:** es la **referencia visual** del sitio de Sabrina, no la arquitectura. Claude Code toma el diseño y construye el frontend de Sabrina consumiendo la API del CMS según este PRD. El **hero** se construye fijo con crossfade (Anexo A) sin importar cómo venga.

**Documentos del kit (adjuntar todos a Claude Code):**
- este **PRD** (la especificación),
- **`anti-ia-principios.md`** (reglas anti-IA, van al `CLAUDE.md`),
- **`esquema.sql`** (modelo de datos en español),
- **`convenciones.md`** (nomenclatura y estándar de código),
- el **handoff de Claude Design** (diseño del sitio de Sabrina).

---

## 1. Visión y alcance

Se construyen dos cosas:
- **A) El sistema / CMS** (compartido, una vez): gestiona el contenido, la auth, los roles, los mantenimientos/pagos, y expone la API.
- **B) El sitio de Sabrina** (primer sitio a medida): su frontend único, que consume la API.

Modelo de negocio: Axs costea el sitio y el sistema; la clienta paga un **mantenimiento mensual** que incluye **un cambio estructural**. Los cambios de contenido los hace ella sola desde el panel (ilimitados).

---

## 2. Arquitectura

- **CMS headless:** **Payload** (standalone, su propia app), sobre **PostgreSQL**. Da el panel de administración, auth, roles, media y la API ya resueltos. Multi-tenant: cada clienta es un tenant que edita solo lo suyo, en el mismo panel.
- **Contenido como contrato (DTOs):** el CMS define la **forma** de cada tipo de sección (ej. `sobre_mi = { titulo, copete, descripcion, imagen }`). Esa forma es el DTO. La API sirve el contenido de cada tenant con esa forma; el frontend lo consume tipado.
- **Biblioteca de tipos de sección (compartida, crece):** `sobre_mi`, `servicios`, `experiencias`, `testimonios`, etc. Si una clienta necesita un tipo nuevo, se agrega una vez al CMS. **Es una biblioteca de DATOS, no de diseño.**
- **Sitios a medida:** cada clienta es una app Next propia, con su diseño exclusivo, que pide su contenido a la API y lo renderiza a su gusto. La estructura, el layout, el motion y el estilo son código del frontend (bespoke).
- **Monorepo (pnpm workspaces):** `apps/cms` (el motor, uno solo), `sites/<rubro>/<clienta>` (un app por clienta, agrupados por rubro), y `packages/cms-client` (capa fina compartida: fetch + tipos de DTO). El diseño no se comparte; el cableado a la API sí.

---

## 3. El sistema / CMS (`apps/cms`)

- **Payload + PostgreSQL.** Collections (en español, ver `esquema.sql`): `clientas`, `usuarios` (super_admin / tenant_editor), `tipos_seccion` + `secciones` (la biblioteca de DTOs y el contenido), `medios`, `suscripciones`, `mantenimientos`, `pagos`.
- **Panel — gestión de contenido:** la clienta entra con su cuenta y edita su contenido (descripciones, títulos, precios, fotos, agregar/quitar servicios, proyectos, testimonios). Por formularios, sin tocar nada estructural.
- **Panel — mantenimientos y pagos:**
  - Ve su **próximo mantenimiento**: fecha, cambio incluido, **monto a pagar**.
  - **Paga** por transferencia o QR (MercadoPago); o en efectivo y Axs lo **marca como pagado**.
  - Ve el **historial** de mantenimientos pasados, con el **detalle de lo que se hizo**, monto y estado.
  - Confirmación de pago: **manual** en v1; webhook de MercadoPago = mejora posterior.
- **API:** REST/GraphQL de Payload, sirve el contenido de cada tenant como DTOs tipados.
- **Roles:** super_admin (Axs) gestiona todo; tenant_editor (clienta) solo lo suyo.

---

## 4. Los sitios a medida (`sites/<rubro>/<clienta>`)

- Cada uno es una app Next independiente, con **diseño único**.
- Trae su contenido desde la API (vía `cms-client`) y lo renderiza con su propio diseño, estructura, layout y motion.
- Se deploya por separado, en su dominio.
- **Lo que la clienta NO toca** (es código del sitio): estructura, layout, diseño, animaciones. Eso lo hace Axs (y es el "cambio estructural" del mantenimiento).

---

## 5. Capa compartida (`packages/cms-client`)

Capa fina reusada por todos los sitios: cliente de la API + **tipos de los DTOs** + helpers de fetching. Evita recablear la conexión al CMS en cada sitio. **No incluye diseño.**

---

## 6. El sitio de Sabrina (el primero) — spec de diseño

### Estructura (secciones)
Hero · Sobre mí · Mi propósito · Todo lo que hago (4 pilares) · Servicios para marcas (Pack) · Cómo trabajo · Experiencias y eventos · Testimonios · Marcas · FAQ · Contacto · WhatsApp fijo · Redes.

### Hero (el punto delicado)
**Un solo hero fijo (sticky), no apilado.** 3 escenas (foto recortada + texto) que hacen **crossfade** según el scroll, con indicador de 3 puntitos. Figura recortada sobre fondo aireado rosa/marrón; texto al lado; sombra/forma orgánica detrás. `sticky` + scroll progress (Framer Motion) + Lenis. Toque opcional: micro-movimiento Higgsfield como `<video>` loop. Mobile: degrada a carrusel/reveals. **Sin frame-sequence.** (Anexo A.)

### Diseño
Elegante, femenino, mucho aire, **paleta rosa/marrón**, fotos grandes, motion sutil, sin parecer IA. Referencia: el **handoff de Claude Design** (diseño) + `anti-ia-principios.md` (reglas anti-IA). Tokens como CSS variables; serif editorial (no Fraunces/Instrument Serif) + sans humanista (no Inter).

### Motion, SEO y performance
Lenis; reveals con `whileInView` (IntersectionObserver), ease-out, `prefers-reduced-motion`. SEO nativo de Next (metadata, OG, sitemap, robots, JSON-LD). Mobile-first, `next/image`, carga rápida. Analytics + Meta Pixel. WhatsApp flotante.

---

## 7. Modelo de datos (CMS)

Collections (Payload sobre PostgreSQL), nombres en español según `esquema.sql` y `convenciones.md`: `clientas`, `usuarios` (roles), `tipos_seccion` + `secciones` (la biblioteca de DTOs y el contenido), `medios`, `suscripciones` (cuota, día de cobro, cambios incluidos), `mantenimientos` (período, fecha, **detalle de lo hecho**, monto, estado), `pagos` (monto, método transferencia/QR/efectivo, estado, fecha, quién confirmó). **Esquema completo: `esquema.sql`.**

---

## 8. Stack y decisiones técnicas (cerradas)

- **Next.js (App Router) + TypeScript** en CMS y sitios.
- **Payload** como CMS headless sobre PostgreSQL.
- **Gestor: pnpm** (no npm). **Versiones pineadas exactas** (sin `^`/`~`), lockfile commiteado.
- **Cadena de suministro:** revisar cada dependencia antes de sumarla, minimizar deps, `pnpm audit`. (Por los ataques recientes a npm, es obligatorio.)
- **APIs:** **DTOs con validación (Zod)** en los bordes, sobre todo en endpoints de pagos/mantenimientos.
- **Motion:** Framer Motion + Lenis. **No usar frame-sequence ni canvas scrubbing.**
- **Nomenclatura:** según `convenciones.md` — DB en snake_case español, código en camelCase/PascalCase español, sin tildes ni ñ en identificadores.
- **Infra:** Docker (build multi-stage) + **Coolify** sobre VPS de Hostinger (auto-deploy desde git, SSL por dominio, reverse proxy, Postgres, backups). El CMS se deploya una vez; cada sitio se deploya por separado en su dominio.

---

## 9. Fases del build

1. **Fase 1 — CMS + sitio de Sabrina.** Levantar el CMS (tipos de contenido + panel de edición de contenido) y construir el frontend de Sabrina consumiendo la API, con contenido ficticio realista. Diseño, hero y anti-IA listos.
2. **Fase 2 — Mantenimientos + deploy.** El área de mantenimientos/pagos del panel; deploy del CMS y del sitio de Sabrina al VPS con Coolify, dominios, SSL y backups.
3. **Fase 3 — Onboarding de clientas.** Cada clienta nueva = un nuevo `sites/<rubro>/<clienta>` con su diseño propio + su tenant en el CMS. Reusa el CMS, el panel y `cms-client`; el diseño es nuevo.

---

## 10. Skills y herramientas (Claude Code)

- **Base anti-genérico:** `taste-skill` (calibrada delicada) — alternativa: Impeccable.
- **Motion:** Emil (`emilkowalski/skill`).
- **frontend-design:** ya incluida.
- **Magic MCP (21st.dev):** para componentes (es MCP, con API key).
- **SEO:** `npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit` (auditoría; el SEO técnico base va nativo en Next).
- **Docker:** `npx skills add https://github.com/github/awesome-copilot --skill multi-stage-dockerfile` (org oficial, segura) y `npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill docker-expert` (**autor desconocido, revisar antes de instalar**).
- **No usar frame-sequence / canvas scrubbing.**

---

## 11. Gitflow

- **main** = producción (Coolify deploya de acá). **develop** = integración/staging.
- **feature branches** cortas desde develop (`feat/`, `fix/`, `chore/`), se mergean por PR.
- **Conventional commits** (`feat:`, `fix:`, `chore:`...). **PRs con CI** (typecheck, lint, build, `pnpm audit`) aunque trabajes solo. **Branch protection** en main/develop.
- **No hay rama por clienta.** Las clientas son apps en el monorepo (su diseño) + datos en la DB (su contenido). El código compartido del sistema mejora para todas a la vez.

---

## 12. `CLAUDE.md` del proyecto

- El contenido completo de `anti-ia-principios.md`.
- **pnpm** (nunca npm), versiones pineadas exactas, lockfile commiteado, vetting de cada dep + `pnpm audit`.
- Convenciones: aplicar `convenciones.md` (nomenclatura en español); TS estricto; el contenido nunca se hardcodea, siempre viene de la API del CMS; **DTOs + Zod** en endpoints custom; tokens vía CSS variables.
- Recordatorio: *"CMS compartido headless + sitios a medida. El contenido vive en el CMS y la clienta lo edita sola desde el panel; el diseño/estructura es código del sitio. Si algo de contenido obliga a hardcodear, está mal."*
- Stack fijo: Next + Payload + Tailwind + Framer Motion + Lenis. Sin otras libs de animación ni canvas/frame-sequence.

---

## 13. Criterios de aceptación

- El CMS sirve el contenido de cada tenant por API con DTOs tipados.
- El sitio de Sabrina se renderiza con su diseño único, trayendo todo el contenido de la API; cambiar contenido en el panel se refleja sin tocar código ni re-deployar.
- La clienta puede, sola desde el panel: editar textos, precios, fotos, agregar/quitar servicios, proyectos y testimonios.
- La clienta ve su próximo mantenimiento (fecha, cambio, monto), inicia el pago (transferencia/QR) y ve el historial con el detalle. Axs marca pagos en efectivo.
- Cada tenant solo ve/edita lo suyo (aislamiento).
- El hero es uno solo, fijo, con crossfade; degrada en mobile; respeta `prefers-reduced-motion`.
- Build reproducible: pnpm, lockfile commiteado, versiones pineadas, `pnpm audit` sin críticas.
- Endpoints de pagos/mantenimientos validan con DTOs (Zod).
- Lighthouse alto; mobile-first; sin "tells" de IA.

---

## 14. Estructura del repo (monorepo)

```
axs-platform/                        (monorepo, pnpm workspaces)
│
├── apps/
│   └── cms/                         EL MOTOR — uno solo, compartido por TODOS
│       ├── payload.config.ts
│       ├── collections/             clientas, usuarios, tipos_seccion, secciones,
│       │                            medios, suscripciones, mantenimientos, pagos
│       └── access/                  aislamiento por tenant
│
├── sites/                           LOS SITIOS — cada uno aislado (diseño + deploy + dominio)
│   ├── influencers/
│   │   ├── sabrina/
│   │   │   ├── app/                 sus páginas (estructura propia)
│   │   │   ├── components/          sus componentes a medida (hero, etc.)
│   │   │   └── lib/theme/           sus tokens (rosa/marrón)
│   │   └── lucia-fit/               misma forma, otro diseño
│   ├── restaurantes/
│   │   ├── la-parrilla/
│   │   └── sushi-formosa/
│   └── institutos/
│       ├── instituto-saber/
│       └── instituto-norte/
│
├── packages/
│   ├── cms-client/                  capa fina compartida: fetch a la API + tipos de DTO
│   └── ui/                          (opcional) primitivas comunes, sin diseño
│
├── CLAUDE.md
├── pnpm-workspace.yaml              globs: apps/*, sites/**, packages/*
├── pnpm-lock.yaml                   versiones pineadas
└── .github/workflows/ci.yml         typecheck + lint + build + pnpm audit
```

Un solo `cms` (en `apps/`) y una sola base sirven a todos los sitios, sin importar el rubro. Para cada clienta nueva: se agrega `sites/<rubro>/<clienta>/` (su diseño) y su tenant en el CMS (su contenido). El CMS, el panel y `cms-client` no se tocan.

---

## Anexo A — Patrón técnico del hero

Hero fijo con crossfade por scroll, **sin frame-sequence**:

```tsx
"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function Scene({ progress, index, total, data }) {
  const start = index / total, end = (index + 1) / total;
  const opacity = useTransform(progress, [start - 0.1, start, end - 0.05, end], [0, 1, 1, 0]);
  return (
    <motion.div style={{ opacity, position: "absolute", inset: 0 }}>
      <img src={data.img} alt="" />
      <h1>{data.title}</h1>
    </motion.div>
  );
}

export function Hero({ scenes }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section ref={ref} style={{ height: "300vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {scenes.map((s, i) => (
          <Scene key={i} progress={scrollYProgress} index={i} total={scenes.length} data={s} />
        ))}
      </div>
    </section>
  );
}
```

Lenis envuelve la app. El contenido (las fotos, los textos de cada escena) viene de la API del CMS; el diseño del hero es propio del sitio.
