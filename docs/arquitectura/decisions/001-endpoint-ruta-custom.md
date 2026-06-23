# ADR-001 — Endpoint custom `/api/sitios/sabrina` en lugar de API REST nativa de Payload

**Fecha:** 2026-06-22
**Estado:** aceptado
**Cambio origen:** `2026-06-feat-cms-headless-sabrina`

## Contexto

El DTO `SitioSabrina` es un agregado de 13 secciones bajo una sola raiz. El sitio necesita todos los datos en un solo fetch para renderizar la pagina. El codigo de `packages/cms-client/src/cliente.ts` ya tenia preparada la ruta de fetch comentada: apuntaba explicitamente a `${baseUrl}/api/sitios/sabrina`.

Payload expone por defecto una API REST por coleccion (`/api/clientas`, `/api/usuarios`, etc.) y una API GraphQL. Tambien tiene una Local API para queries server-side dentro del mismo proceso.

## Decision

Se usa una **ruta custom en el App Router del CMS** (`apps/cms/src/app/api/sitios/sabrina/route.ts`) que:
1. Lee el Global `sitio-sabrina` via la Local API de Payload.
2. Ensambla el objeto con la forma de `SitioSabrinaSchema`.
3. Devuelve `application/json` con el DTO completo.

`cms-client` hace un solo `fetch` y valida la respuesta con `SitioSabrinaSchema.parse()`.

## Alternativas consideradas

**A) API REST nativa de Payload por coleccion:** el cliente haria N fetches (uno por seccion) y ensamblaria el objeto. Rompe el principio de "capa fina": `cms-client` tendria que conocer el modelo interno del CMS para saber que colecciones consultar y como combinarlas. Cualquier cambio de modelado en el CMS obligaria a cambiar `cms-client`.

**B) GraphQL:** permite el agregado en una sola query. Agrega complejidad de cliente (query language, cliente GraphQL). El beneficio de la query flexible no aplica aqui: el contrato es fijo y conocido. La ruta custom es mas directa.

## Consecuencias

- El ensamblado del DTO vive en el CMS, donde esta el conocimiento del modelo. `cms-client` es realmente una capa fina.
- El contrato entre CMS y sitio esta definido por `SitioSabrinaSchema`, no por los endpoints internos de Payload.
- Para agregar un nuevo sitio (Fase 3), se agrega una nueva ruta custom (ej. `/api/sitios/lucia-fit`) sin cambiar el contrato de Sabrina.
- La ruta custom no tiene rate limiting en Fase 1 (deuda registrada, Fase 2).
- El 500 actual expone `error.message` en el campo `detalle` (deuda registrada, fix pendiente de baja complejidad).
