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
  access: {
    // super_admin ve todas las clientas; tenant_editor solo su propia clienta (filtro por id).
    // Nota: los registros de Clientas son la raíz del tenant — no tienen un field `clienta`
    // propio, son el tenant mismo. Por eso el filtro es por `id`, no por relationship.
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.rol === "super_admin") return true;
      if (user.clienta) {
        const clientaId =
          typeof user.clienta === "object" ? user.clienta.id : user.clienta;
        return { id: { equals: clientaId } };
      }
      return false;
    },
    // Solo super_admin puede crear, modificar o eliminar clientas.
    create: ({ req: { user } }) => user?.rol === "super_admin",
    update: ({ req: { user } }) => user?.rol === "super_admin",
    delete: ({ req: { user } }) => user?.rol === "super_admin",
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
