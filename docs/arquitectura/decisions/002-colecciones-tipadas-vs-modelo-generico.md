# ADR-002 — Colecciones/globals tipados de Payload en lugar del modelo generico `tipos_seccion` + `secciones` JSON

**Fecha:** 2026-06-22
**Estado:** aceptado
**Cambio origen:** `2026-06-feat-cms-headless-sabrina`

## Contexto

`docs/esquema.sql` propone un modelo generico: `tipos_seccion` define el contrato de cada tipo de seccion como JSON (`esquema jsonb`), y `secciones` guarda instancias con datos en `datos jsonb`. El mismo esquema aclara: "Con Payload estas tablas se generan desde la config; esto documenta la forma esperada."

Payload favorece colecciones y globals con campos tipados declarados en la config TypeScript, de los cuales el adaptador genera columnas SQL y el panel genera formularios de edicion.

## Decision

El contenido del sitio de Sabrina se modela como un **Global de Payload** (`sitio-sabrina`) con los 13 bloques como `group`/`array` fields tipados, espejando 1:1 las 13 partes de `SitioSabrinaSchema`. `medios` es una upload collection separada.

No se implementa el modelo generico `tipos_seccion` + `secciones` en Fase 1.

## Alternativas consideradas

**Modelo generico (`tipos_seccion` + `secciones` jsonb):** permite agregar tipos de seccion en runtime sin tocar codigo. El tradeoff es que la edicion requiere editar JSON crudo o construir un form-builder dinamico sobre los campos definidos en `esquema jsonb` — exactamente lo que Payload ya resuelve con su sistema de fields tipados. Ademas dificulta la generacion de tipos TypeScript estaticos para el DTO.

## Consecuencias

- El panel de Payload muestra formularios estructurados por seccion. La clienta no ve JSON.
- `payload generate:types` produce `apps/cms/src/payload-types.ts`. El endpoint puede usar estos tipos directamente (deuda: usa casts manuales en Fase 1).
- El adaptador `@payloadcms/db-postgres` genera columnas snake_case a partir de los campos camelCase de Payload, alineando con la convencion de `docs/esquema.sql`.
- La flexibilidad de agregar tipos de seccion en runtime queda diferida a Fase 3. Se reevalua entonces y puede derivar en un ADR que supersede este.
- El Global `sitio-sabrina` es un singleton por instalacion de Payload (no un documento por tenant). Coherente con Fase 1 donde Sabrina es la unica clienta. En Fase 3, con multiples clientas con estructuras distintas, se migrara a colecciones por tenant y este ADR sera supersedido.
