import type { Access } from "payload";

/**
 * Access control por tenant: super_admin ve y edita todo.
 * tenant_editor solo accede a los recursos de su clienta asignada.
 */
export const accesoPorTenant: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (user.rol === "super_admin") return true;
  // tenant_editor: filtrar por la clienta asignada
  if (user.clienta) {
    const clientaId = typeof user.clienta === "object" ? user.clienta.id : user.clienta;
    return { clienta: { equals: clientaId } };
  }
  return false;
};
