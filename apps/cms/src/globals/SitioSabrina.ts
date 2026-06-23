import type { GlobalConfig } from "payload";

/**
 * Global singleton que contiene el contenido completo del sitio de Sabrina.
 * Modela los 13 bloques del DTO SitioSabrinaSchema como group/array fields tipados.
 * El endpoint /api/sitios/sabrina lee este global y ensambla el DTO.
 *
 * Campos en camelCase español (convenciones) → columnas snake_case generadas por el adaptador.
 */
export const SitioSabrina: GlobalConfig = {
  slug: "sitio-sabrina",
  admin: {
    group: "Contenido del sitio",
  },
  fields: [
    // ─── config ──────────────────────────────────────────────────────────────
    {
      name: "config",
      type: "group",
      fields: [
        { name: "nombre", type: "text", required: true },
        { name: "acento", type: "text", required: true, admin: { description: "Color en formato hex. Ej: #D98BA0" } },
        { name: "acentoSuave", type: "text", required: true, admin: { description: "Variante clara del acento. Ej: #F3D9DD" } },
        { name: "whatsapp", type: "text", required: true, admin: { description: "Número completo sin + ni espacios. Ej: 5493704000000" } },
        { name: "instagram", type: "text" },
        { name: "tiktok", type: "text" },
      ],
    },
    // ─── hero ─────────────────────────────────────────────────────────────────
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "ctaPrimario", type: "text", required: true },
        { name: "ctaSecundario", type: "text", required: true },
        {
          name: "escenas",
          type: "array",
          minRows: 1,
          required: true,
          fields: [
            { name: "etiqueta", type: "text", required: true },
            { name: "titulo", type: "text", required: true, admin: { description: "Admite \\n para saltos de línea" } },
            { name: "copete", type: "text", required: true },
            {
              name: "imagen",
              type: "group",
              fields: [
                { name: "url", type: "text", required: true },
                { name: "textoAlternativo", type: "text", required: true },
              ],
            },
          ],
        },
      ],
    },
    // ─── sobreMi ─────────────────────────────────────────────────────────────
    {
      name: "sobreMi",
      type: "group",
      fields: [
        { name: "copete", type: "text", required: true },
        { name: "titulo", type: "text", required: true },
        { name: "parrafos", type: "array", required: true, fields: [{ name: "texto", type: "text", required: true }] },
        {
          name: "imagen",
          type: "group",
          fields: [
            { name: "url", type: "text", required: true },
            { name: "textoAlternativo", type: "text", required: true },
          ],
        },
      ],
    },
    // ─── proposito ───────────────────────────────────────────────────────────
    {
      name: "proposito",
      type: "group",
      fields: [
        { name: "icono", type: "text", required: true, admin: { description: "Nombre del icono Phosphor. Ej: flower-lotus" } },
        { name: "texto", type: "text", required: true },
      ],
    },
    // ─── pilares ─────────────────────────────────────────────────────────────
    {
      name: "pilares",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        { name: "copete", type: "text", required: true },
        {
          name: "pilares",
          type: "array",
          required: true,
          fields: [
            { name: "icono", type: "text", required: true },
            { name: "titulo", type: "text", required: true },
            { name: "descripcion", type: "text", required: true },
            { name: "nota", type: "text" },
            {
              name: "variante",
              type: "select",
              options: [
                { label: "Grande", value: "grande" },
                { label: "Compacto", value: "compacto" },
                { label: "Banda", value: "banda" },
              ],
              defaultValue: "compacto",
              required: true,
            },
          ],
        },
      ],
    },
    // ─── pack ────────────────────────────────────────────────────────────────
    {
      name: "pack",
      type: "group",
      fields: [
        { name: "etiqueta", type: "text", required: true },
        { name: "titulo", type: "text", required: true },
        { name: "descripcion", type: "text", required: true },
        { name: "incluye", type: "array", required: true, fields: [{ name: "item", type: "text", required: true }] },
        { name: "cita", type: "text", required: true },
        {
          name: "imagen",
          type: "group",
          fields: [
            { name: "url", type: "text", required: true },
            { name: "textoAlternativo", type: "text", required: true },
          ],
        },
      ],
    },
    // ─── comoTrabajo ─────────────────────────────────────────────────────────
    {
      name: "comoTrabajo",
      type: "group",
      fields: [
        { name: "copete", type: "text", required: true },
        { name: "titulo", type: "text", required: true },
        {
          name: "pasos",
          type: "array",
          required: true,
          fields: [
            { name: "numero", type: "text", required: true },
            { name: "titulo", type: "text", required: true },
            { name: "descripcion", type: "text", required: true },
          ],
        },
      ],
    },
    // ─── experiencias ────────────────────────────────────────────────────────
    {
      name: "experiencias",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        { name: "copete", type: "text", required: true },
        {
          name: "experiencias",
          type: "array",
          required: true,
          fields: [
            { name: "titulo", type: "text", required: true },
            { name: "descripcion", type: "text", required: true },
            {
              name: "imagen",
              type: "group",
              fields: [
                { name: "url", type: "text", required: true },
                { name: "textoAlternativo", type: "text", required: true },
              ],
            },
          ],
        },
        {
          name: "tambienOrganizo",
          type: "array",
          required: true,
          fields: [
            { name: "icono", type: "text", required: true },
            { name: "texto", type: "text", required: true },
          ],
        },
      ],
    },
    // ─── testimonios ─────────────────────────────────────────────────────────
    {
      name: "testimonios",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        {
          name: "testimonios",
          type: "array",
          required: true,
          fields: [
            { name: "cita", type: "text", required: true },
            { name: "nombre", type: "text", required: true },
            { name: "rol", type: "text", required: true },
            { name: "destacado", type: "checkbox", defaultValue: false },
          ],
        },
      ],
    },
    // ─── marcas ──────────────────────────────────────────────────────────────
    {
      name: "marcas",
      type: "group",
      fields: [
        { name: "copete", type: "text", required: true },
        { name: "marcas", type: "array", required: true, fields: [{ name: "nombre", type: "text", required: true }] },
      ],
    },
    // ─── faq ─────────────────────────────────────────────────────────────────
    {
      name: "faq",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        {
          name: "items",
          type: "array",
          required: true,
          fields: [
            { name: "pregunta", type: "text", required: true },
            { name: "respuesta", type: "text", required: true },
          ],
        },
      ],
    },
    // ─── contacto ────────────────────────────────────────────────────────────
    {
      name: "contacto",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        { name: "descripcion", type: "text", required: true },
      ],
    },
    // ─── redes ───────────────────────────────────────────────────────────────
    {
      name: "redes",
      type: "group",
      fields: [
        { name: "nombre", type: "text", required: true },
        { name: "descripcion", type: "text", required: true },
        {
          name: "redes",
          type: "array",
          required: true,
          fields: [
            { name: "icono", type: "text", required: true },
            { name: "etiqueta", type: "text", required: true },
            { name: "url", type: "text", required: true },
          ],
        },
        { name: "ubicacion", type: "text", required: true },
        { name: "nota", type: "text", required: true },
      ],
    },
  ],
};
