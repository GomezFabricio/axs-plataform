import type { CollectionConfig } from "payload";
import { accesoPorTenant } from "../access/porTenant";

/**
 * Colección de autenticación del panel de Payload.
 * Roles: super_admin (acceso total) | tenant_editor (solo su clienta).
 */
export const Usuarios: CollectionConfig = {
  slug: "usuarios",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    read: accesoPorTenant,
    update: accesoPorTenant,
    delete: ({ req: { user } }) => user?.rol === "super_admin",
  },
  fields: [
    {
      name: "rol",
      type: "select",
      options: [
        { label: "Super Admin", value: "super_admin" },
        { label: "Editor de clienta", value: "tenant_editor" },
      ],
      required: true,
      defaultValue: "tenant_editor",
    },
    {
      name: "clienta",
      type: "relationship",
      relationTo: "clientas",
      admin: {
        condition: (data) => data?.["rol"] === "tenant_editor",
        description: "Clienta asignada. Solo aplica para editores de tenant.",
      },
    },
  ],
};
