import type { CollectionConfig } from "payload";

/**
 * Upload collection de medios. Mapea a MedioSchema del DTO:
 * { url, textoAlternativo, ancho?, alto? }.
 * En Fase 1 el seed usa URLs directas de public/assets del sitio;
 * el upload de binarios al storage del CMS es Fase 2.
 */
export const Medios: CollectionConfig = {
  slug: "medios",
  upload: {
    staticDir: "media",
  },
  admin: {
    useAsTitle: "textoAlternativo",
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
    },
  ],
};
