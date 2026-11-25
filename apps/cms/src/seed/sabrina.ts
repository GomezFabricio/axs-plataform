import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Payload } from "payload";
import { sitioSabrina } from "@axs/cms-client/fixtures";

/**
 * Seed del tenant Sabrina: crea la clienta, sube las imágenes de referencia como medios
 * y carga el global sitio-sabrina con el contenido de fixtures/sabrina.ts.
 * Idempotente: re-correrlo no duplica datos.
 */
/** Carpeta public/ del sitio: las rutas de imagen del fixture (/assets/...) son relativas a ella. */
const DIR_PUBLIC_SITIO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../sites/influencers/sabrina/public",
);

/**
 * Devuelve el id del medio para una imagen del fixture, subiéndola si todavía no existe.
 * Idempotente: identifica el medio por nombre de archivo dentro de los medios de la clienta.
 */
export async function asegurarMedio(
  payload: Payload,
  clientaId: string | number,
  imagen: { url: string; textoAlternativo: string },
): Promise<number> {
  const archivo = path.basename(imagen.url);
  const existentes = await payload.find({
    collection: "medios",
    where: { filename: { equals: archivo }, clienta: { equals: Number(clientaId) } },
    limit: 1,
  });
  if (existentes.docs[0]) return existentes.docs[0].id;

  const medio = await payload.create({
    collection: "medios",
    data: { textoAlternativo: imagen.textoAlternativo, clienta: Number(clientaId) },
    filePath: path.join(DIR_PUBLIC_SITIO, imagen.url),
  });
  payload.logger.info(`Medio subido: ${archivo} (id: ${medio.id})`);
  return medio.id;
}

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

  // ── 2. Subir las imágenes de referencia como medios ──────────────────────
  // En serie: asegurarMedio deduplica por nombre de archivo y hero-1/hero-2 se repiten.
  const imagenesEscenas: number[] = [];
  for (const e of sitioSabrina.hero.escenas) {
    imagenesEscenas.push(await asegurarMedio(payload, clientaId, e.imagen));
  }
  const imagenSobreMi = await asegurarMedio(payload, clientaId, sitioSabrina.sobreMi.imagen);
  const imagenPack = await asegurarMedio(payload, clientaId, sitioSabrina.pack.imagen);
  const imagenesExperiencias: number[] = [];
  for (const e of sitioSabrina.experiencias.experiencias) {
    imagenesExperiencias.push(await asegurarMedio(payload, clientaId, e.imagen));
  }

  // ── 3. Cargar el global sitio-sabrina ────────────────────────────────────
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
        escenas: sitioSabrina.hero.escenas.map((e, i) => ({
          etiqueta: e.etiqueta,
          titulo: e.titulo,
          copete: e.copete,
          imagen: imagenesEscenas[i]!,
        })),
      },
      sobreMi: {
        copete: sitioSabrina.sobreMi.copete,
        titulo: sitioSabrina.sobreMi.titulo,
        parrafos: sitioSabrina.sobreMi.parrafos.map((p) => ({ texto: p })),
        imagen: imagenSobreMi,
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
        imagen: imagenPack,
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
        experiencias: sitioSabrina.experiencias.experiencias.map((e, i) => ({
          titulo: e.titulo,
          descripcion: e.descripcion,
          imagen: imagenesExperiencias[i]!,
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
