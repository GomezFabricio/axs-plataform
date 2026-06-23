# Tareas — Afinar landing de Sabrina Báez

Checklist mutable. `/fg-implement` tacha cada tarea al completarla. Modo Rápido: sin fase
de diseño, las tareas salen directo del punch-list del README.

## P1 — Accesibilidad y reglas duras

- [x] Agregar token `--acento-texto` en `app/globals.css` (rosa más oscuro que pase WCAG AA
      4.5:1 sobre fondo claro), sobrescribible por la clienta igual que `--acento`.
- [x] Aplicar `--acento-texto` a eyebrows/labels de texto chico; dejar `--acento` solo para
      fills e íconos.
- [x] Revisar el marrón tenue (`#a08573`) del copete de Marcas y subir contraste si falla AA.
- [x] Reemplazar em-dash (—) por punto medio (·) o coma en `app/layout.tsx`: `title.default`,
      `title.template`, OG title y Twitter title.

## P2 — Estructura y consistencia visual

- [x] Hero: dejar `<h1>` solo en la escena 1; escenas 2 y 3 pasan a `<p>` con el mismo estilo
      visual.
- [x] Quitar el `border:1px` de las cards de Pilares, Testimonios y Experiencias dejando solo
      la sombra suave (un tratamiento, no ambos).
- [x] Reducir eyebrows a 1-2 secciones (de hero, Sobre mí, Pack, Cómo trabajo): cumplir máx 1
      cada 3 secciones.
- [x] Hero mobile: recomponer la figura placeholder para que no se empaste con el texto
      (figura arriba enmarcada o bajar su peso visual).

## P3 — Detalles finos

- [x] Bajar radios de card de 18-24px a 16px.
- [x] Subir el CTA "Charlemos" del header a 44px de alto mínimo (target táctil AA).
- [x] Puntitos decorativos del hero en mobile: animarlos o sacarlos en mobile.

## Verificación de cierre

- [x] `pnpm typecheck` y `pnpm build` verdes en `sites/influencers/sabrina`.
- [ ] Revisión manual en navegador (desktop y mobile) de los puntos tocados.
- [ ] Sin em-dash en contenido visible ni metadata; un solo acento; tokens como CSS variables.
