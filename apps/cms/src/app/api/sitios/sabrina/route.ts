import { getPayload } from "payload";
import configPromise from "@payload-config";
import { NextResponse } from "next/server";

/**
 * GET /api/sitios/sabrina
 * Lee el Global sitio-sabrina vía la Local API de Payload y devuelve el DTO
 * con la forma exacta de SitioSabrinaSchema (validado en el borde por cms-client).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const payload = await getPayload({ config: configPromise });

    const global = await payload.findGlobal({ slug: "sitio-sabrina" });

    if (!global) {
      return NextResponse.json(
        { error: "Sitio no encontrado" },
        { status: 404 }
      );
    }

    const config = global.config as {
      nombre?: string;
      acento?: string;
      acentoSuave?: string;
      whatsapp?: string;
      instagram?: string;
      tiktok?: string;
    } | null | undefined;

    if (!config?.nombre || !config.acento || !config.acentoSuave || !config.whatsapp) {
      return NextResponse.json(
        { error: "Contenido del sitio incompleto" },
        { status: 422 }
      );
    }

    // ── Mapear el global a la forma exacta de SitioSabrinaSchema ─────────────

    const hero = global.hero as {
      ctaPrimario?: string;
      ctaSecundario?: string;
      escenas?: Array<{
        etiqueta?: string;
        titulo?: string;
        copete?: string;
        imagen?: { url?: string; textoAlternativo?: string };
      }>;
    } | null | undefined;

    const sobreMi = global.sobreMi as {
      copete?: string;
      titulo?: string;
      parrafos?: Array<{ texto?: string }>;
      imagen?: { url?: string; textoAlternativo?: string };
    } | null | undefined;

    const proposito = global.proposito as {
      icono?: string;
      texto?: string;
    } | null | undefined;

    const pilaresGroup = global.pilares as {
      titulo?: string;
      copete?: string;
      pilares?: Array<{
        icono?: string;
        titulo?: string;
        descripcion?: string;
        nota?: string;
        variante?: "grande" | "compacto" | "banda";
      }>;
    } | null | undefined;

    const pack = global.pack as {
      etiqueta?: string;
      titulo?: string;
      descripcion?: string;
      incluye?: Array<{ item?: string }>;
      cita?: string;
      imagen?: { url?: string; textoAlternativo?: string };
    } | null | undefined;

    const comoTrabajo = global.comoTrabajo as {
      copete?: string;
      titulo?: string;
      pasos?: Array<{ numero?: string; titulo?: string; descripcion?: string }>;
    } | null | undefined;

    const experienciasGroup = global.experiencias as {
      titulo?: string;
      copete?: string;
      experiencias?: Array<{
        titulo?: string;
        descripcion?: string;
        imagen?: { url?: string; textoAlternativo?: string };
      }>;
      tambienOrganizo?: Array<{ icono?: string; texto?: string }>;
    } | null | undefined;

    const testimoniosGroup = global.testimonios as {
      titulo?: string;
      testimonios?: Array<{
        cita?: string;
        nombre?: string;
        rol?: string;
        destacado?: boolean;
      }>;
    } | null | undefined;

    const marcasGroup = global.marcas as {
      copete?: string;
      marcas?: Array<{ nombre?: string }>;
    } | null | undefined;

    const faqGroup = global.faq as {
      titulo?: string;
      items?: Array<{ pregunta?: string; respuesta?: string }>;
    } | null | undefined;

    const contacto = global.contacto as {
      titulo?: string;
      descripcion?: string;
    } | null | undefined;

    const redesGroup = global.redes as {
      nombre?: string;
      descripcion?: string;
      redes?: Array<{ icono?: string; etiqueta?: string; url?: string }>;
      ubicacion?: string;
      nota?: string;
    } | null | undefined;

    const dto = {
      config: {
        nombre: config.nombre,
        acento: config.acento,
        acentoSuave: config.acentoSuave,
        whatsapp: config.whatsapp,
        ...(config.instagram ? { instagram: config.instagram } : {}),
        ...(config.tiktok ? { tiktok: config.tiktok } : {}),
      },
      hero: {
        ctaPrimario: hero?.ctaPrimario ?? "",
        ctaSecundario: hero?.ctaSecundario ?? "",
        escenas: (hero?.escenas ?? []).map((e) => ({
          etiqueta: e.etiqueta ?? "",
          titulo: e.titulo ?? "",
          copete: e.copete ?? "",
          imagen: {
            url: e.imagen?.url ?? "",
            textoAlternativo: e.imagen?.textoAlternativo ?? "",
          },
        })),
      },
      sobreMi: {
        copete: sobreMi?.copete ?? "",
        titulo: sobreMi?.titulo ?? "",
        parrafos: (sobreMi?.parrafos ?? []).map((p) => p.texto ?? ""),
        imagen: {
          url: sobreMi?.imagen?.url ?? "",
          textoAlternativo: sobreMi?.imagen?.textoAlternativo ?? "",
        },
      },
      proposito: {
        icono: proposito?.icono ?? "",
        texto: proposito?.texto ?? "",
      },
      pilares: {
        titulo: pilaresGroup?.titulo ?? "",
        copete: pilaresGroup?.copete ?? "",
        pilares: (pilaresGroup?.pilares ?? []).map((p) => ({
          icono: p.icono ?? "",
          titulo: p.titulo ?? "",
          descripcion: p.descripcion ?? "",
          // Payload guarda campos opcionales no seteados como null en JSON.
          // Zod espera string | undefined, no null, para z.string().optional().
          ...(p.nota != null ? { nota: p.nota } : {}),
          variante: p.variante ?? "compacto",
        })),
      },
      pack: {
        etiqueta: pack?.etiqueta ?? "",
        titulo: pack?.titulo ?? "",
        descripcion: pack?.descripcion ?? "",
        incluye: (pack?.incluye ?? []).map((i) => i.item ?? ""),
        cita: pack?.cita ?? "",
        imagen: {
          url: pack?.imagen?.url ?? "",
          textoAlternativo: pack?.imagen?.textoAlternativo ?? "",
        },
      },
      comoTrabajo: {
        copete: comoTrabajo?.copete ?? "",
        titulo: comoTrabajo?.titulo ?? "",
        pasos: (comoTrabajo?.pasos ?? []).map((p) => ({
          numero: p.numero ?? "",
          titulo: p.titulo ?? "",
          descripcion: p.descripcion ?? "",
        })),
      },
      experiencias: {
        titulo: experienciasGroup?.titulo ?? "",
        copete: experienciasGroup?.copete ?? "",
        experiencias: (experienciasGroup?.experiencias ?? []).map((e) => ({
          titulo: e.titulo ?? "",
          descripcion: e.descripcion ?? "",
          imagen: {
            url: e.imagen?.url ?? "",
            textoAlternativo: e.imagen?.textoAlternativo ?? "",
          },
        })),
        tambienOrganizo: (experienciasGroup?.tambienOrganizo ?? []).map((t) => ({
          icono: t.icono ?? "",
          texto: t.texto ?? "",
        })),
      },
      testimonios: {
        titulo: testimoniosGroup?.titulo ?? "",
        testimonios: (testimoniosGroup?.testimonios ?? []).map((t) => ({
          cita: t.cita ?? "",
          nombre: t.nombre ?? "",
          rol: t.rol ?? "",
          destacado: t.destacado ?? false,
        })),
      },
      marcas: {
        copete: marcasGroup?.copete ?? "",
        marcas: (marcasGroup?.marcas ?? []).map((m) => m.nombre ?? ""),
      },
      faq: {
        titulo: faqGroup?.titulo ?? "",
        items: (faqGroup?.items ?? []).map((i) => ({
          pregunta: i.pregunta ?? "",
          respuesta: i.respuesta ?? "",
        })),
      },
      contacto: {
        titulo: contacto?.titulo ?? "",
        descripcion: contacto?.descripcion ?? "",
      },
      redes: {
        nombre: redesGroup?.nombre ?? "",
        descripcion: redesGroup?.descripcion ?? "",
        redes: (redesGroup?.redes ?? []).map((r) => ({
          icono: r.icono ?? "",
          etiqueta: r.etiqueta ?? "",
          url: r.url ?? "",
        })),
        ubicacion: redesGroup?.ubicacion ?? "",
        nota: redesGroup?.nota ?? "",
      },
    };

    return NextResponse.json(dto);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: "No se pudo obtener el sitio", detalle: message },
      { status: 500 }
    );
  }
}
