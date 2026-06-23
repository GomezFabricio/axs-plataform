# Afinar landing de Sabrina Báez

**Tipo:** fix
**Estado:** cerrado
**Sitio afectado:** `sites/influencers/sabrina`
**Nivel de ceremonia:** Rápido (sin fase de diseño)

---

## Qué

Pulido de la landing de Sabrina Báez a partir de una crítica de diseño hecha con la
skill Impeccable cruzada con las reglas anti-IA del proyecto. Es un conjunto acotado de
correcciones de presentación: contraste de color para accesibilidad, limpieza de SEO,
estructura semántica del hero, y detalles de tarjetas, eyebrows y composición mobile.

No se toca contenido (todo sigue viniendo del cms-client tipado), ni el contrato de
datos, ni la arquitectura, ni el CMS. Son cambios de estilo, markup, tokens CSS y
metadata.

## Por qué

La landing está construida y verificada (typecheck y build verdes, SSG, navegador), pero
la crítica de diseño detectó desvíos respecto de dos estándares que el proyecto considera
piso: WCAG AA de contraste y las reglas anti-IA (`docs/anti-ia-principios.md`). Algunos
puntos son defectos concretos de accesibilidad (texto rosa chico que falla AA) y otros son
"tells" de diseño generado por IA que el proyecto prohíbe explícitamente (em-dash, exceso
de eyebrows, doble tratamiento de borde más sombra en cards, tres `<h1>`).

Corregirlos ahora, antes de sumar fotos reales y más secciones, mantiene la base limpia.

## Alcance

Punch-list priorizado (P1 a P3):

### P1 — Accesibilidad y reglas duras
- **Contraste del acento como texto.** El acento rosa (`--acento: #d98ba0`) usado como
  texto chico (eyebrows/labels) sobre fondo claro falla WCAG AA (~2.3:1). Introducir un
  token nuevo `--acento-texto` (rosa más oscuro que pase 4.5:1) para texto, dejando
  `--acento` para fills e íconos. Revisar también el marrón tenue (`#a08573`) del copete
  de Marcas.
- **Em-dash en SEO.** `app/layout.tsx` usa em-dash (—) en `title.default`, `title.template`
  y los OG/Twitter titles. Reemplazar por punto medio (·) o coma. Regla anti-IA: cero
  em-dash en contenido visible.

### P2 — Estructura y consistencia visual
- **Tres `<h1>` en desktop.** El hero crossfade renderiza 3 escenas, cada una con su `<h1>`.
  Dejar `<h1>` solo en la escena 1; las otras dos pasan a `<p>` con el mismo estilo visual.
- **Patrón ghost-card.** Cards de Pilares, Testimonios y Experiencias combinan `border:1px`
  más sombra ancha (blur 50-56px). Quedarse con la sombra suave y sacar el borde de 1px
  (elegir uno, no ambos).
- **Eyebrows de más.** Labels de color arriba del h2 en hero, Sobre mí, Pack y Cómo trabajo.
  Reducir a 1-2 secciones (anti-IA: máx 1 cada 3 secciones).
- **Hero mobile.** La figura placeholder se empasta detrás del texto. Mejorar la composición
  en mobile (figura arriba enmarcada o bajar su peso visual) para que el texto respire.

### P3 — Detalles finos
- Radios de card de 18-24px a 16px.
- CTA "Charlemos" del header a 44px de alto mínimo (hoy 43px) para target táctil AA.
- Puntitos decorativos del hero en mobile (sin crossfade): animarlos o sacarlos en mobile.

### Fuera de alcance
- Contenido (copy, datos): no se hardcodea ni se edita; vive en el CMS vía cms-client.
- Contrato de DTOs, esquema de datos, endpoints, CMS (`apps/cms`).
- Arquitectura del monorepo y stack.
- Fotos reales (siguen como placeholders SVG hasta que lleguen del CMS).
- Tests (no hay suite; TDD off).

## Restricciones

- **Contenido desde el CMS.** Todo lo visible llega del `cms-client` tipado. Estos cambios
  son de estilo, markup, tokens CSS y SEO, nunca de contenido en componentes.
- **Reglas anti-IA** (`docs/anti-ia-principios.md`): cero em-dash, un solo acento, tokens
  como CSS variables, motion sutil con `prefers-reduced-motion`.
- **Convenciones** (`docs/convenciones.md`): identificadores sin tildes ni ñ; tipos
  PascalCase español; no se cambia el stack.
- **TDD off** (`docs/auditoria/config.yaml`): no hay test runner. No se agregan tests.
- **Tokens de color** vivian en `app/globals.css` como CSS variables; `--acento` es
  sobrescribible por la clienta vía inline style en el root, así que el token nuevo de
  texto debe respetar ese mismo mecanismo de override.

## Contexto del codebase

CodeGraph no está indexado en este workspace (sin `.codegraph/`), así que el contexto se
resolvió leyendo el código directamente y la memoria del build previo (engram
`axs-sabrina-sitio-build`).

Archivos candidatos a tocar:
- `app/globals.css` — tokens CSS (acento, sombras, radios).
- `app/layout.tsx` — metadata/SEO (title, template, OG/Twitter).
- `components/Hero.tsx` — h1 múltiples, eyebrow, figura mobile, puntitos decorativos.
- `components/Header.tsx` — alto del CTA "Charlemos".
- `components/Pilares.tsx`, `components/Testimonios.tsx`, `components/Experiencias.tsx` —
  patrón borde + sombra en cards.
- `components/SobreMi.tsx`, `components/Pack.tsx`, `components/ComoTrabajo.tsx` — eyebrows.
- `components/Marcas.tsx` — copete marrón tenue.

Verificado en código: el token `--acento: #d98ba0` existe en `globals.css` y `layout.tsx`
contiene em-dashes en `title.default`, `title.template` y los OG/Twitter titles, tal como
describe la crítica.

## Cierre

Cambio cerrado por `/fg-review`. El punch-list se completó: todas las tareas P1, P2 y P3
quedaron tachadas en `tareas.md` (la verificación manual en navegador queda a cargo del
dev, sin bloquear el cierre).

### Qué quedó hecho

- **Contraste AA**: token nuevo `--acento-texto: #a8466a` (5.4:1 sobre `--fondo`, pasa
  WCAG AA) aplicado a los eyebrows de Hero y Sobre mí; `--acento` (#d98ba0) queda para
  fills e íconos. El copete de Marcas pasó a `--marron` (7.3:1).
- **SEO**: em-dash (—) reemplazado por punto medio (·) en `title`, `template`, OG y
  Twitter de `layout.tsx`. Cero em-dash en todo `app/` y `components/`.
- **Semántica del hero**: solo la escena 0 renderiza `<h1>`; las escenas 1-2 usan `<p>`
  con estilo idéntico. `<h1>` único en desktop y en mobile. Jerarquía h1→h2→h3 sin saltos.
- **Ghost-cards**: removido el `border:1px` de Pilares, Testimonios y Experiencias; queda
  solo la sombra suave.
- **Eyebrows**: reducidos a 2 (hero + Sobre mí); quitados de Pack y Cómo trabajo.
- **Mobile**: `HeroEstatico` rediseñado (`FiguraMobile` enmarcada arriba + texto con
  respaldo opaco); puntitos decorativos no se renderizan en mobile.
- **Detalles**: `--radio-md` 18→16, `--radio-lg` 24→20; CTA "Charlemos" a ~44.8px de alto.
- **Degrade**: `prefers-reduced-motion` y fallback estático del hero siguen funcionando;
  motion solo `transform`/`opacity`.
- **Sin regresión de contenido**: todo el texto visible sigue llegando por props tipadas
  de `@axs/cms-client`. No se hardcodeó contenido.

### Validación técnica

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck | `pnpm --filter @axs/sabrina typecheck` | ✅ verde (sin errores) |
| Lint | `pnpm --filter @axs/sabrina lint` | ✅ verde (sin warnings) |
| Build | `pnpm --filter @axs/sabrina build` | ✅ verde (SSG, 6 páginas) |

TDD off (sin suite de tests en el proyecto): se aplicó validación básica, sin TDD Cycle
Evidence ni assertion audit.

### Reviewers

| Rol | Verdict | CRITICAL | WARNING | SUGGESTION |
|---|---|---|---|---|
| `code-reviewer` | issues_found (no bloqueante) | 0 | 1 | 3 |
| `frontend-reviewer` | approved | 0 | 1 | 3 |

Ningún reviewer reportó `blocking`. El cambio se cierra con observaciones, sin re-ejecución.

**Observaciones para follow-up (ninguna bloqueante):**

1. **(code-reviewer, WARNING)** `--acento-texto` queda fijo en `globals.css` y no se
   inyecta desde `sitio.config` como `--acento`/`--acento-suave` en `app/page.tsx`. La
   restricción del README pedía que respetara el mismo mecanismo de override. Hoy no lo
   hace: si una clienta sobrescribe `--acento` con otro tono, `--acento-texto` no acompaña
   y podría volver a fallar AA. Resolverlo requiere extender el contrato del `cms-client`
   con un campo `acentoTexto`, lo que excede este fix de estilo. Recomendado como próximo
   incremento.
2. **(frontend-reviewer, WARNING)** `components/Contacto.tsx` usa `var(--acento)` como
   color de un link de texto chico (~2.46:1, falla AA). Es el mismo defecto que este
   cambio corrigió en los eyebrows, pero Contacto quedó fuera del alcance declarado.
   Aplicar `--acento-texto` ahí cerraría la inconsistencia.
3. **(SUGGESTION, ambos)** Hardcodeos menores de token (`borderRadius: 20` en Testimonios
   vs `--radio-lg`), `minHeight: 44` explícito en el CTA del Header en vez de inferirlo del
   padding, `:focus-visible` para inputs de Contacto, y `key={index}` en los `.map` de
   listas si el CMS reordena. Todos diferibles.

### Estructural

`structural: false`. El cambio toca solo CSS, markup y metadata. No agrega dependencias
(no modifica `package.json`), no hay migraciones, no crea módulos top-level nuevos, no
toca el contrato de datos ni el CMS. No se sugiere `/fg-update-arch`.
