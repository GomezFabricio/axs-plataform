import type { CollectionConfig } from "payload";
import { APIError } from "payload";
import { accesoPorTenant } from "../access/porTenant";

/**
 * Colección de autenticación del panel de Payload.
 * Roles: super_admin (acceso total) | tenant_editor (solo su clienta).
 *
 * Modelo de permisos (ver D6 en decisiones.md para la tabla completa):
 * - create colección: solo super_admin (enforced via beforeChange hook — ver nota abajo).
 * - read/update colección: accesoPorTenant (super_admin todo; editor solo su doc).
 * - delete colección: solo super_admin.
 * - field rol: create y update solo super_admin; default tenant_editor protege el camino feliz.
 * - field clienta: create y update solo super_admin; bloquea IDOR de reasignación.
 *
 * NOTA sobre auth collections y hooks en Payload 3.x:
 * El endpoint POST /api/usuarios es el handler de registro de auth. En Payload 3.x,
 * este endpoint bypasea tanto access.create a nivel colección como los hooks beforeOperation.
 * La restricción efectiva de create se aplica via hook beforeChange (que SÍ es evaluado
 * por el handler de registro) lanzando APIError(403) si el solicitante no es super_admin.
 * Excepción: registerFirstUser (/api/usuarios/first-register) — Payload lo maneja por
 * separado y bypasea también beforeChange, lo que es el comportamiento correcto para el
 * bootstrap inicial del sistema.
 */
export const Usuarios: CollectionConfig = {
  slug: "usuarios",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    // Segunda capa defensiva para la Local API (donde access.create sí se evalúa).
    create: ({ req: { user } }) => user?.rol === "super_admin",
    read: accesoPorTenant,
    update: accesoPorTenant,
    delete: ({ req: { user } }) => user?.rol === "super_admin",
  },
  hooks: {
    beforeChange: [
      // Enforce: solo super_admin puede crear usuarios via el endpoint REST de auth.
      // access.create y beforeOperation no se evalúan en el registro de auth collections;
      // beforeChange sí es evaluado por ese path.
      ({ operation, req }) => {
        if (operation === "create") {
          if (!req.user || req.user.rol !== "super_admin") {
            throw new APIError(
              "Solo super_admin puede crear usuarios.",
              403,
            );
          }
        }
      },
    ],
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
      access: {
        // Al crear un usuario, solo super_admin puede asignar el rol super_admin.
        // Si el creador no es super_admin, Payload descarta el valor entrante y aplica
        // el defaultValue "tenant_editor".
        create: ({ req }) => req.user?.rol === "super_admin",
        // Al actualizar, igual: solo super_admin puede cambiar el rol.
        update: ({ req }) => req.user?.rol === "super_admin",
      },
    },
    {
      name: "clienta",
      type: "relationship",
      relationTo: "clientas",
      admin: {
        condition: (data) => data?.["rol"] === "tenant_editor",
        description: "Clienta asignada. Solo aplica para editores de tenant.",
      },
      access: {
        // Al crear un usuario, solo super_admin puede asignar la clienta.
        // Cierra el camino de asignación de clienta ajena al crear.
        create: ({ req }) => req.user?.rol === "super_admin",
        // Al actualizar, solo super_admin puede reasignar la clienta (IDOR fix).
        update: ({ req }) => req.user?.rol === "super_admin",
      },
    },
  ],
};
