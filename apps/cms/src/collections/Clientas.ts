import type { CollectionConfig } from "payload";

/**
 * Colección de tenants (clientas). Cada registro representa una clienta de la plataforma.
 * Sabrina es el primer tenant (slug: "sabrina").
 * Slug de colección: snake_case español plural (convenciones).
 */
export const Clientas: CollectionConfig = {
  slug: "clientas",
  admin: {
    useAsTitle: "nombre",
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Identificador único de la clienta. Ej: sabrina. No cambiar después del setup inicial.",
      },
    },
    {
      name: "dominio",
      type: "text",
      admin: {
        description: "Dominio del sitio de la clienta. Ej: sabrinabaez.com",
      },
    },
    {
      name: "theme",
      type: "json",
      admin: {
        description: "Tokens de diseño adicionales en formato JSON (opcional).",
      },
    },
    {
      name: "estaActiva",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
