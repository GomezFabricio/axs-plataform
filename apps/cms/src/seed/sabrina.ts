import type { Payload } from "payload";
import { sitioSabrina } from "@axs/cms-client/fixtures";

/**
 * Seed del tenant Sabrina: crea la clienta y carga el global sitio-sabrina
 * con el contenido de fixtures/sabrina.ts.
 * Idempotente: re-correrlo no duplica datos.
 */
export async function seedSabrina(payload: Payload): Promise<void> {
  // ── 1. Crear o reusar la clienta Sabrina ─────────────────────────────────
  const existentes = await payload.find({
    collection: "clientas",
    where: { slug: { equals: "sabrina" } },
    limit: 1,
  });

  let clientaId: string | number;

  if (existentes.docs.length === 0) {
    const clienta = await payload.create({
      collection: "clientas",
      data: {
        nombre: sitioSabrina.config.nombre,
        slug: "sabrina",
        dominio: undefined,
        estaActiva: true,
      },
    });
    clientaId = clienta.id;
    payload.logger.info(`Clienta Sabrina creada (id: ${clientaId})`);
  } else {
    clientaId = existentes.docs[0]!.id;
    payload.logger.info(`Clienta Sabrina ya existe (id: ${clientaId}), se omite creación`);
  }

  // ── 2. Cargar el global sitio-sabrina ────────────────────────────────────
  // Payload globals son singletons; updateGlobal es idempotente.
  await payload.updateGlobal({
    slug: "sitio-sabrina",
    data: {
      config: {
        nombre: sitioSabrina.config.nombre,
        acento: sitioSabrina.config.acento,
        acentoSuave: sitioSabrina.config.acentoSuave,
        whatsapp: sitioSabrina.config.whatsapp,
        instagram: sitioSabrina.config.instagram,
        tiktok: sitioSabrina.config.tiktok,
      },
      hero: {
        ctaPrimario: sitioSabrina.hero.ctaPrimario,
        ctaSecundario: sitioSabrina.hero.ctaSecundario,
        escenas: sitioSabrina.hero.escenas.map((e) => ({
          etiqueta: e.etiqueta,
          titulo: e.titulo,
          copete: e.copete,
          imagen: { url: e.imagen.url, textoAlternativo: e.imagen.textoAlternativo },
        })),
      },
      sobreMi: {
        copete: sitioSabrina.sobreMi.copete,
        titulo: sitioSabrina.sobreMi.titulo,
        parrafos: sitioSabrina.sobreMi.parrafos.map((p) => ({ texto: p })),
        imagen: {
          url: sitioSabrina.sobreMi.imagen.url,
          textoAlternativo: sitioSabrina.sobreMi.imagen.textoAlternativo,
        },
      },
      proposito: {
        icono: sitioSabrina.proposito.icono,
        texto: sitioSabrina.proposito.texto,
      },
      pilares: {
        titulo: sitioSabrina.pilares.titulo,
        copete: sitioSabrina.pilares.copete,
        pilares: sitioSabrina.pilares.pilares.map((p) => ({
          icono: p.icono,
          titulo: p.titulo,
          descripcion: p.descripcion,
          nota: p.nota,
          variante: p.variante ?? "compacto",
        })),
      },
      pack: {
        etiqueta: sitioSabrina.pack.etiqueta,
        titulo: sitioSabrina.pack.titulo,
        descripcion: sitioSabrina.pack.descripcion,
        incluye: sitioSabrina.pack.incluye.map((i) => ({ item: i })),
        cita: sitioSabrina.pack.cita,
        imagen: {
          url: sitioSabrina.pack.imagen.url,
          textoAlternativo: sitioSabrina.pack.imagen.textoAlternativo,
        },
      },
      comoTrabajo: {
        copete: sitioSabrina.comoTrabajo.copete,
        titulo: sitioSabrina.comoTrabajo.titulo,
        pasos: sitioSabrina.comoTrabajo.pasos.map((p) => ({
          numero: p.numero,
          titulo: p.titulo,
          descripcion: p.descripcion,
        })),
      },
      experiencias: {
        titulo: sitioSabrina.experiencias.titulo,
        copete: sitioSabrina.experiencias.copete,
        experiencias: sitioSabrina.experiencias.experiencias.map((e) => ({
          titulo: e.titulo,
          descripcion: e.descripcion,
          imagen: { url: e.imagen.url, textoAlternativo: e.imagen.textoAlternativo },
        })),
        tambienOrganizo: sitioSabrina.experiencias.tambienOrganizo.map((t) => ({
          icono: t.icono,
          texto: t.texto,
        })),
      },
      testimonios: {
        titulo: sitioSabrina.testimonios.titulo,
        testimonios: sitioSabrina.testimonios.testimonios.map((t) => ({
          cita: t.cita,
          nombre: t.nombre,
          rol: t.rol,
          destacado: t.destacado ?? false,
        })),
      },
      marcas: {
        copete: sitioSabrina.marcas.copete,
        marcas: sitioSabrina.marcas.marcas.map((m) => ({ nombre: m })),
      },
      faq: {
        titulo: sitioSabrina.faq.titulo,
        items: sitioSabrina.faq.items.map((i) => ({
          pregunta: i.pregunta,
          respuesta: i.respuesta,
        })),
      },
      contacto: {
        titulo: sitioSabrina.contacto.titulo,
        descripcion: sitioSabrina.contacto.descripcion,
      },
      redes: {
        nombre: sitioSabrina.redes.nombre,
        descripcion: sitioSabrina.redes.descripcion,
        redes: sitioSabrina.redes.redes.map((r) => ({
          icono: r.icono,
          etiqueta: r.etiqueta,
          url: r.url,
        })),
        ubicacion: sitioSabrina.redes.ubicacion,
        nota: sitioSabrina.redes.nota,
      },
    },
  });

  payload.logger.info("Global sitio-sabrina cargado con el contenido del fixture");
}
