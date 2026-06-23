import type { z } from "zod";
import type {
  MedioSchema,
  ConfigSitioSchema,
  EscenaHeroSchema,
  SeccionHeroSchema,
  SeccionSobreMiSchema,
  SeccionPropositoSchema,
  PilarSchema,
  SeccionPilaresSchema,
  SeccionPackSchema,
  PasoTrabajoSchema,
  SeccionComoTrabajoSchema,
  ExperienciaSchema,
  SeccionExperienciasSchema,
  TestimonioSchema,
  SeccionTestimoniosSchema,
  SeccionMarcasSchema,
  ItemFaqSchema,
  SeccionFaqSchema,
  SeccionContactoSchema,
  RedSocialSchema,
  SeccionRedesSchema,
  SitioSabrinaSchema,
} from "./esquemas";

/**
 * Tipos de DTO inferidos de los esquemas Zod. No se editan a mano: si cambia el
 * contrato, se cambia el esquema en esquemas.ts y el tipo se actualiza solo.
 */

export type Medio = z.infer<typeof MedioSchema>;
export type ConfigSitio = z.infer<typeof ConfigSitioSchema>;
export type EscenaHero = z.infer<typeof EscenaHeroSchema>;
export type SeccionHero = z.infer<typeof SeccionHeroSchema>;
export type SeccionSobreMi = z.infer<typeof SeccionSobreMiSchema>;
export type SeccionProposito = z.infer<typeof SeccionPropositoSchema>;
export type Pilar = z.infer<typeof PilarSchema>;
export type SeccionPilares = z.infer<typeof SeccionPilaresSchema>;
export type SeccionPack = z.infer<typeof SeccionPackSchema>;
export type PasoTrabajo = z.infer<typeof PasoTrabajoSchema>;
export type SeccionComoTrabajo = z.infer<typeof SeccionComoTrabajoSchema>;
export type Experiencia = z.infer<typeof ExperienciaSchema>;
export type SeccionExperiencias = z.infer<typeof SeccionExperienciasSchema>;
export type Testimonio = z.infer<typeof TestimonioSchema>;
export type SeccionTestimonios = z.infer<typeof SeccionTestimoniosSchema>;
export type SeccionMarcas = z.infer<typeof SeccionMarcasSchema>;
export type ItemFaq = z.infer<typeof ItemFaqSchema>;
export type SeccionFaq = z.infer<typeof SeccionFaqSchema>;
export type SeccionContacto = z.infer<typeof SeccionContactoSchema>;
export type RedSocial = z.infer<typeof RedSocialSchema>;
export type SeccionRedes = z.infer<typeof SeccionRedesSchema>;
export type SitioSabrina = z.infer<typeof SitioSabrinaSchema>;
