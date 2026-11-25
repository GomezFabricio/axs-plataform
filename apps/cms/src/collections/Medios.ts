import { APIError } from "payload";
import type { CollectionConfig } from "payload";
import { accesoPorTenant } from "../access/porTenant";

/** Recorre el contenido del sitio buscando algún campo `imagen` que apunte al medio. */
function usaMedio(valor: unknown, medioId: string | number): boolean {
  if (Array.isArray(valor)) return valor.some((item) => usaMedio(item, medioId));
  if (typeof valor !== "object" || valor === null) return false;
  return Object.entries(valor).some(([clave, hijo]) =>
    clave === "imagen" && (typeof hijo === "number" || typeof hijo === "string")
      ? String(hijo) === String(medioId)
      : usaMedio(hijo, medioId),
  );
}

/**
 * Upload collection de medios. Mapea a MedioSchema del DTO:
 * { url, textoAlternativo, ancho?, alto? }.
 * Las imágenes del sitio (global sitio-sabrina) son campos upload que apuntan acá;
 * la clienta las sube desde el panel.
 *
 * Modelo de permisos (ver D6 en decisiones.md):
 * - read: público sin sesión, para que los sitios y los navegadores carguen los archivos
 *   (/api/medios/file/<archivo>). Con sesión, accesoPorTenant: en el panel cada editor
 *   ve solo los medios de su clienta.
 * - create/update/delete colección: accesoPorTenant (editor solo sus medios).
 * - field clienta: create y update restringidos a super_admin a nivel field; read oculto
 *   sin sesión. Para tenant_editor, el hook beforeChange fija clienta = req.user.clienta
 *   automáticamente en create, permitiendo subir medios sin setear el campo manualmente
 *   (y sin poder apuntar a otra clienta).
 */

/** Formatos aceptados. SVG queda afuera: puede llevar scripts y se sirve desde el origen del CMS. */
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const Medios: CollectionConfig = {
  slug: "medios",
  upload: {
    // MEDIA_DIR permite que los tests guarden los archivos fuera del repo.
    staticDir: process.env["MEDIA_DIR"] ?? "media",
    mimeTypes: TIPOS_IMAGEN_PERMITIDOS,
  },
  admin: {
    useAsTitle: "textoAlternativo",
  },
  access: {
    // Sin sesión: lectura pública (las imágenes se muestran en el sitio de la clienta).
    // Con sesión: tenant_editor solo ve sus medios; super_admin ve todos.
    read: (args) => (args.req.user ? accesoPorTenant(args) : true),
    create: accesoPorTenant,
    update: accesoPorTenant,
    delete: accesoPorTenant,
  },
  hooks: {
    beforeDelete: [
      // Una foto usada en el sitio no se borra: la base lo rechazaría (FK NOT NULL), pero
      // Payload ya habría eliminado el archivo del disco y el sitio quedaría con la imagen rota.
      async ({ req, id }) => {
        const sitio = await req.payload.findGlobal({ slug: "sitio-sabrina", depth: 0, req });
        if (usaMedio(sitio, id)) {
          throw new APIError(
            "Esta foto está en uso en el sitio. Primero hay que reemplazarla en el contenido.",
            400,
            undefined,
            true,
          );
        }
      },
    ],
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
        // La lectura pública no expone a qué clienta pertenece cada medio.
        read: ({ req }) => Boolean(req.user),
        // Solo super_admin puede setear o reasignar la clienta de un medio.
        // Para tenant_editor el hook beforeChange fija la clienta automáticamente en create.
        create: ({ req }) => req.user?.rol === "super_admin",
        update: ({ req }) => req.user?.rol === "super_admin",
      },
    },
  ],
};
