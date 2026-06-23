import { z } from "zod";

/**
 * Esquemas Zod = el contrato de la API del CMS para el sitio de Sabrina.
 * Los tipos TypeScript se infieren de acá (ver tipos.ts), una sola fuente de verdad.
 * El cliente valida la respuesta de la API contra estos esquemas en el borde.
 */

export const MedioSchema = z.object({
  url: z.string(),
  textoAlternativo: z.string(),
  ancho: z.number().int().positive().optional(),
  alto: z.number().int().positive().optional(),
});

export const ConfigSitioSchema = z.object({
  nombre: z.string(),
  acento: z.string(),
  acentoSuave: z.string(),
  whatsapp: z.string(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
});

export const EscenaHeroSchema = z.object({
  etiqueta: z.string(),
  titulo: z.string(),
  copete: z.string(),
  imagen: MedioSchema,
});

export const SeccionHeroSchema = z.object({
  ctaPrimario: z.string(),
  ctaSecundario: z.string(),
  escenas: z.array(EscenaHeroSchema).min(1),
});

export const SeccionSobreMiSchema = z.object({
  copete: z.string(),
  titulo: z.string(),
  parrafos: z.array(z.string()),
  imagen: MedioSchema,
});

export const SeccionPropositoSchema = z.object({
  icono: z.string(),
  texto: z.string(),
});

export const PilarSchema = z.object({
  icono: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  nota: z.string().optional(),
  variante: z.enum(["grande", "compacto", "banda"]).default("compacto"),
});

export const SeccionPilaresSchema = z.object({
  titulo: z.string(),
  copete: z.string(),
  pilares: z.array(PilarSchema),
});

export const SeccionPackSchema = z.object({
  etiqueta: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  incluye: z.array(z.string()),
  cita: z.string(),
  imagen: MedioSchema,
});

export const PasoTrabajoSchema = z.object({
  numero: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
});

export const SeccionComoTrabajoSchema = z.object({
  copete: z.string(),
  titulo: z.string(),
  pasos: z.array(PasoTrabajoSchema),
});

export const ExperienciaSchema = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  imagen: MedioSchema,
});

export const EtiquetaConIconoSchema = z.object({
  icono: z.string(),
  texto: z.string(),
});

export const SeccionExperienciasSchema = z.object({
  titulo: z.string(),
  copete: z.string(),
  experiencias: z.array(ExperienciaSchema),
  tambienOrganizo: z.array(EtiquetaConIconoSchema),
});

export const TestimonioSchema = z.object({
  cita: z.string(),
  nombre: z.string(),
  rol: z.string(),
  destacado: z.boolean().default(false),
});

export const SeccionTestimoniosSchema = z.object({
  titulo: z.string(),
  testimonios: z.array(TestimonioSchema),
});

export const SeccionMarcasSchema = z.object({
  copete: z.string(),
  marcas: z.array(z.string()),
});

export const ItemFaqSchema = z.object({
  pregunta: z.string(),
  respuesta: z.string(),
});

export const SeccionFaqSchema = z.object({
  titulo: z.string(),
  items: z.array(ItemFaqSchema),
});

export const SeccionContactoSchema = z.object({
  titulo: z.string(),
  descripcion: z.string(),
});

export const RedSocialSchema = z.object({
  icono: z.string(),
  etiqueta: z.string(),
  url: z.string(),
});

export const SeccionRedesSchema = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  redes: z.array(RedSocialSchema),
  ubicacion: z.string(),
  nota: z.string(),
});

export const SitioSabrinaSchema = z.object({
  config: ConfigSitioSchema,
  hero: SeccionHeroSchema,
  sobreMi: SeccionSobreMiSchema,
  proposito: SeccionPropositoSchema,
  pilares: SeccionPilaresSchema,
  pack: SeccionPackSchema,
  comoTrabajo: SeccionComoTrabajoSchema,
  experiencias: SeccionExperienciasSchema,
  testimonios: SeccionTestimoniosSchema,
  marcas: SeccionMarcasSchema,
  faq: SeccionFaqSchema,
  contacto: SeccionContactoSchema,
  redes: SeccionRedesSchema,
});
