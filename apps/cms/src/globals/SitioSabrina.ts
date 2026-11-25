import type { GlobalConfig, AccessArgs, Field } from "payload";

/**
 * Imagen del sitio: la clienta la sube (o elige una ya subida) desde el panel.
 * El texto alternativo se carga en el medio, una sola vez por archivo.
 */
const campoImagen: Field = {
  name: "imagen",
  type: "upload",
  relationTo: "medios",
  required: true,
  // Solo medios de la clienta dueña del sitio. Payload lo aplica en el selector y lo valida
  // al guardar, así un id de medio de otra clienta (o inexistente) se rechaza con 400.
  filterOptions: async ({ req }) => ({
    clienta: { equals: (await idClientaSabrina(req)) ?? -1 },
  }),
  admin: {
    description: "Foto nueva o una ya cargada en la biblioteca. Formatos: JPG, PNG, WebP o AVIF.",
  },
};

/**
 * Global singleton que contiene el contenido completo del sitio de Sabrina.
 * Modela los 13 bloques del DTO SitioSabrinaSchema como group/array fields tipados.
 * El endpoint /api/sitios/sabrina lee este global y ensambla el DTO.
 *
 * Campos en camelCase español (convenciones) → columnas snake_case generadas por el adaptador.
 *
 * Access control:
 * - super_admin puede leer y actualizar siempre.
 * - tenant_editor de Sabrina (clienta con slug "sabrina") puede leer y actualizar.
 * - Otros tenant_editors (futuros) NO pueden tocar este global.
 * - El endpoint público /api/sitios/sabrina usa Local API con overrideAccess:true (por defecto
 *   en la Local API de Payload), por lo que NO se ve afectado por estas restricciones.
 *
 * DEUDA FASE 3: este global es un singleton sin field `clienta` que lo vincule a un tenant.
 * El modelo multi-tenant correcto (un global o colección por tenant) queda pendiente para Fase 3.
 * Hoy el ownership se resuelve pragmáticamente: resolving el id de la clienta "sabrina" por slug
 * y comparando con req.user.clienta. Ver D7 en decisiones.md.
 */

/**
 * Resuelve si el usuario autenticado es el tenant_editor de la clienta dueña de este global.
 * La "clienta dueña" se identifica por el slug "sabrina" (constante de slug, no id numérico).
 * Devuelve true si el usuario es super_admin o el editor asignado a esa clienta.
 * Async porque necesita resolver el id del slug via Local API.
 */
const SLUG_CLIENTA_SABRINA = "sabrina" as const;

/**
 * Id de la clienta dueña de este global, resuelto por slug (no hardcodear el id numérico).
 * overrideAccess: true — consulta interna del sistema, no acción del usuario.
 */
async function idClientaSabrina(req: AccessArgs["req"]): Promise<number | undefined> {
  const resultado = await req.payload.find({
    collection: "clientas",
    where: { slug: { equals: SLUG_CLIENTA_SABRINA } },
    limit: 1,
    overrideAccess: true,
    req,
  });
  return resultado.docs[0]?.id;
}

async function esEditorDeSabrina({ req }: AccessArgs): Promise<boolean> {
  const user = req.user;
  if (!user) return false;
  if (user.rol === "super_admin") return true;
  if (user.rol !== "tenant_editor" || !user.clienta) return false;

  const clientaSabrinaId = await idClientaSabrina(req);
  if (clientaSabrinaId === undefined) return false;

  const userClientaId =
    typeof user.clienta === "object" && user.clienta !== null
      ? (user.clienta as { id: number | string }).id
      : user.clienta;

  return String(userClientaId) === String(clientaSabrinaId);
}

export const SitioSabrina: GlobalConfig = {
  slug: "sitio-sabrina",
  admin: {
    group: "Contenido del sitio",
  },
  access: {
    // read: panel de Payload. super_admin ve siempre; tenant_editor de Sabrina también.
    // El endpoint público /api/sitios/sabrina usa Local API con overrideAccess (default),
    // así que este bloque no afecta al endpoint público.
    read: esEditorDeSabrina,
    // update: solo super_admin o el tenant_editor de Sabrina.
    update: esEditorDeSabrina,
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
            campoImagen,
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
        campoImagen,
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
        campoImagen,
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
            campoImagen,
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
