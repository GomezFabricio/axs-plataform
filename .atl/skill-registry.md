# Skill Registry — axs-plataform

<!-- axs-plataform se resuelve como el basename del directorio de trabajo (cwd). -->
<!-- Auto-generado por forge (/fg-update-registry). Regenerar tras instalar, crear, mover o renombrar skills. -->

Última actualización: 2026-06-22

## Fuentes escaneadas

- .claude/skills/ (proyecto)
- ~/.claude/skills (usuario)

## Contrato

**Solo para delegadores.** Este registry es un índice, no un resumen. Cualquier agente que lance sub-agentes lo lee para seleccionar skills relevantes, luego pasa los paths exactos de `SKILL.md` para que el sub-agente los lea antes de trabajar.

`SKILL.md` es la fuente de verdad. No inyectar resúmenes generados ni compact rules; pasar paths para que los sub-agentes carguen el contrato completo del autor.

## Skills

| Skill | Trigger / descripción | Scope | Path |
| --- | --- | --- | --- |
| `impeccable` | Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks. | project | `/Users/fabriciogomez/Documents/Projects/axs-plataform/.claude/skills/impeccable/SKILL.md` |
| `emil-design-eng` | This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great. | project | `/Users/fabriciogomez/Documents/Projects/axs-plataform/.claude/skills/emil-design-eng/SKILL.md` |
| `multi-stage-dockerfile` | Create optimized multi-stage Dockerfiles for any language or framework | project | `/Users/fabriciogomez/Documents/Projects/axs-plataform/.claude/skills/multi-stage-dockerfile/SKILL.md` |
| `review-animations` | Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned. | project | `/Users/fabriciogomez/Documents/Projects/axs-plataform/.claude/skills/review-animations/SKILL.md` |
| `seo-audit` | When the user wants to audit, review, or diagnose SEO issues on their site. Also use when the user mentions "SEO audit," "technical SEO," "why am I not ranking," "SEO issues," "on-page SEO," "meta tags review," "SEO health check," "my traffic dropped," "lost rankings," "not showing up in Google," "site isn't ranking," "Google update hit me," "page speed," "core web vitals," "crawl errors," or "indexing issues." Use this even if the user just says something vague like "my SEO is bad" or "help with SEO" — start with an audit. | project | `/Users/fabriciogomez/Documents/Projects/axs-plataform/.claude/skills/seo-audit/SKILL.md` |
| `commit-convention` | Convención de commits para proyectos del Poder Judicial de Formosa. Trigger: Al hacer un commit, redactar un mensaje de commit, o usar /commit. | user | `/Users/fabriciogomez/.claude/skills/commit-convention/SKILL.md` |
| `prd` | Genera un PRD.md a partir de una plantilla y un context.md. Recibe: path al context.md + template.md (plantilla con placeholders). Produce: PRD.md en el MISMO directorio donde está el context.md. Si el context define el stack tecnológico SIN versiones, usa Context7 para resolver las versiones estables. El usuario debe revisar y ajustar el PRD.md manualmente antes de continuar. NO crea carpetas, NO calcula números, NO mueve archivos — solo lee context y genera PRD. | user | `/Users/fabriciogomez/.claude/skills/prd/SKILL.md` |
| `rfc` | Genera un RFC.md a partir de una plantilla, un context.md y opcionalmente un PRD.md. Recibe: path al context.md o PRD.md + rfc-template.md (plantilla con placeholders). Produce: RFC.md en el MISMO directorio donde está el context.md/PRD.md. Si el context define el stack tecnológico SIN versiones, usa Context7 para resolver las versiones estables. El usuario debe revisar y ajustar el RFC.md manualmente antes de continuar. NO crea carpetas, NO calcula números, NO mueve archivos — solo lee inputs y genera RFC. | user | `/Users/fabriciogomez/.claude/skills/rfc/SKILL.md` |
| `definition-agent-rules` | Lee PRD.md y RFC.md desde el directorio de implementación y genera todos los archivos de reglas del agente del proyecto (raíz + por directorio). Bajo Claude Code genera CLAUDE.md; bajo OpenCode genera AGENTS.md. Ejecutar DESPUÉS de skill-prd y DESPUÉS de que el usuario revise y ajuste el PRD. Genera en un solo paso: archivo raíz, estructura de carpetas, y archivos por directorio. | user | `/Users/fabriciogomez/.claude/skills/definition-agent-rules/SKILL.md` |
| `sync-skills-accion` | Escanea las skills disponibles y pobla las secciones Auto-invoke de todos los AGENTS.md (OpenCode) o CLAUDE.md (Claude Code) del proyecto. Lee: ~/.config/opencode/skills/ (OpenCode) o ~/.claude/skills/ (Claude Code) + ./skills/ del proyecto. Produce: Secciones "### Auto-invoke Skills" actualizadas en cada archivo de reglas del agente. | user | `/Users/fabriciogomez/.claude/skills/sync-skills-accion/SKILL.md` |

## Protocolo de carga

1. Matchear contexto de tarea y archivos destino contra la columna `Trigger / descripción`.
2. Pasar solo los valores `Path` coincidentes al sub-agente bajo `## Skills to load before work`.
3. Indicar al sub-agente que lea esos archivos `SKILL.md` ANTES de leer, escribir, revisar, testear o crear artefactos.
4. Si ninguna skill coincide, continuar sin inyección y reportar el campo `skill_resolution` con valor `none`.
