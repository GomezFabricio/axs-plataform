import type { CollectionConfig } from "payload";
import { accesoPorTenant } from "../access/porTenant";

/**
 * Upload collection de medios. Mapea a MedioSchema del DTO:
 * { url, textoAlternativo, ancho?, alto? }.
 * En Fase 1 el seed usa URLs directas de public/assets del sitio;
 * el upload de binarios al storage del CMS es Fase 2.
 *
 * Modelo de permisos (ver D6 en decisiones.md):
 * - create/read/update/delete colección: accesoPorTenant (editor solo sus medios).
 * - field clienta: create y update restringidos a super_admin a nivel field.
 *   Para tenant_editor, el hook beforeChange fija clienta = req.user.clienta
 *   automáticamente en create, permitiendo subir medios sin setear el campo manualmente
 *   (y sin poder apuntar a otra clienta).
 */
export const Medios: CollectionConfig = {
  slug: "medios",
  upload: {
    staticDir: "media",
  },
  admin: {
    useAsTitle: "textoAlternativo",
  },
  access: {
    // tenant_editor solo ve/gestiona los medios de su clienta (filtro por field `clienta`).
    // super_admin ve y gestiona todos.
    read: accesoPorTenant,
    create: accesoPorTenant,
    update: accesoPorTenant,
    delete: accesoPorTenant,
  },
  hooks: {
    beforeChange: [
      // Para tenant_editor: auto-asignar la clienta del usuario en create.
      // Esto permite que el editor suba medios sin exponer el selector de clienta
      // (el field-access de clienta.create es super_admin only, así que el editor
      // no puede setearlo manualmente de todos modos).
      ({ req, data, operation }) => {
        if (
          operation === "create" &&
          req.user?.rol === "tenant_editor" &&
          req.user.clienta
        ) {
          const clientaId =
            typeof req.user.clienta === "object"
              ? req.user.clienta.id
              : req.user.clienta;
          return { ...data, clienta: clientaId };
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "textoAlternativo",
      type: "text",
      required: true,
      label: "Texto alternativo",
    },
    {
      name: "clienta",
      type: "relationship",
      relationTo: "clientas",
      admin: {
        description: "Clienta a la que pertenece este medio.",
      },
      access: {
        // Solo super_admin puede setear o reasignar la clienta de un medio.
        // Para tenant_editor el hook beforeChange fija la clienta automáticamente en create.
        create: ({ req }) => req.user?.rol === "super_admin",
        update: ({ req }) => req.user?.rol === "super_admin",
      },
    },
  ],
};
