# ADR-003 — Versiones pineadas de Payload y gestion de peers (`graphql@16.x`)

**Fecha:** 2026-06-22
**Estado:** aceptado
**Cambio origen:** `2026-06-feat-cms-headless-sabrina`

## Contexto

El proyecto usa `save-exact=true` en `.npmrc` (pnpm) y prohibe rangos `^`/`~`. Esto aplica tambien a las dependencias de Payload. Al agregar Payload aparece un conflicto de peers no obvio: `@payloadcms/next@3.85.1` declara `peerDependencies: { graphql: "^16.8.1" }`. El registry de npm sirve `graphql@17.0.1` como `latest`. Con `auto-install-peers=true`, si no se pinea explicitamente la version de `graphql`, pnpm instala `17.0.1`, que rompe la resolucion de peers de Payload.

## Decision

Se pinean exactas en `apps/cms/package.json`:

```
payload                       3.85.1
@payloadcms/next              3.85.1
@payloadcms/db-postgres       3.85.1
@payloadcms/richtext-lexical  3.85.1
@payloadcms/ui                3.85.1
graphql                       16.14.2   (ultimo 16.x; NO 17.x)
next                          16.2.9    (mismo pin que sites/influencers/sabrina)
react / react-dom             19.2.7    (mismo pin que el sitio)
sharp                         0.35.2
```

`@payloadcms/ui@3.85.1` se agrega como dependencia **directa** de `apps/cms` aunque es transitiva de `@payloadcms/next`. Razon: con Turbopack, `apps/cms/src/app/(payload)/layout.tsx` (generado por Payload) importa `@payloadcms/ui/scss/app.scss` directamente; pnpm no crea symlinks para transitivas en proyectos workspace y el build fallaba con "Module not found".

## Alternativas consideradas

**No pinear `graphql` explicitamente:** pnpm instala `graphql@17.0.1`, rompiendo los peers de `@payloadcms/next`.

**Usar `overrides` en el `package.json` raiz:** forzaria la version sin declararla como directa. Se descarta porque agrega indirec y puede ocultar el conflicto en auditorias futuras. La declaracion directa es mas explicita.

## Consecuencias

- El `pnpm-lock.yaml` tiene versiones exactas; `pnpm install` es deterministico entre entornos.
- Al actualizar Payload en el futuro, revisar si el peer de `graphql` cambio (puede pasar a `^17.x`). Si cambia, actualizar el pin.
- `pnpm audit` debe correr en CI. Revisar al actualizar `@payloadcms/ui` en versiones futuras.
- Al incorporar un nuevo sitio al monorepo, pinear `next@16.2.9` y `react@19.2.7` para que coincidan con el CMS y evitar duplicados en el store de pnpm.
