import { Forbidden, ValidationError, getPayload } from "payload";
import type { Payload } from "payload";
import sharp from "sharp";
import config from "@payload-config";
import type { Clienta, Medio, Usuario } from "@/payload-types";
import { cerrarPayload } from "./entorno";

/**
 * Fábricas de datos de test. Es el único archivo de los tests que conoce los roles: los tests
 * piden "una editora de esta clienta" o "un administrador de Axs" y no saben cómo se modela.
 * Todo se crea con la API local y `overrideAccess: true`, con correos y slugs únicos.
 */

export type UsuarioDeTest = Usuario & { clave: string };

type TipoImagen = "png" | "jpeg" | "webp" | "avif" | "gif" | "svg";

const CLAVE_DE_TEST = "clave-de-prueba-2026";

/**
 * Quién crea los usuarios. El hook de Usuarios exige que quien crea sea administrador aun con
 * `overrideAccess`, igual que en el panel.
 */
const ADMINISTRADOR_DEL_SISTEMA = { id: 0, rol: "super_admin", collection: "usuarios" };

const TIPOS_MIME: Record<TipoImagen, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const SVG_MINIMO = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#c8785a"/></svg>',
);

/** Imágenes base de 8x8 por formato. Se generan una vez: sharp solo tiene API asíncrona. */
const IMAGENES_BASE: Record<TipoImagen, Buffer> = {
  png: await generarImagen("png"),
  jpeg: await generarImagen("jpeg"),
  webp: await generarImagen("webp"),
  avif: await generarImagen("avif"),
  gif: await generarImagen("gif"),
  svg: SVG_MINIMO,
};

async function generarImagen(formato: Exclude<TipoImagen, "svg">): Promise<Buffer> {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 120, b: 90 } },
  })
    .toFormat(formato)
    .toBuffer();
}

let secuencia = 0;
function siguiente(): number {
  secuencia += 1;
  return secuencia;
}

let instancia: Promise<Payload> | undefined;

/** Payload del archivo de test, conectado a su base propia. Es la misma instancia que usan los handlers. */
export async function obtenerPayloadDeTest(): Promise<Payload> {
  instancia ??= getPayload({ config });
  return instancia;
}

/** Cierra la conexión del archivo de test, si se abrió. La usa preparacionArchivo.ts al terminar. */
export async function cerrarPayloadDeTest(): Promise<void> {
  if (!instancia) return;
  const payload = await instancia;
  instancia = undefined;
  await cerrarPayload(payload);
}

export async function crearClienta(datos?: { nombre?: string; slug?: string }): Promise<Clienta> {
  const payload = await obtenerPayloadDeTest();
  const n = siguiente();
  return payload.create({
    collection: "clientas",
    data: {
      nombre: datos?.nombre ?? `Clienta de prueba ${n}`,
      slug: datos?.slug ?? `clienta-prueba-${n}`,
    },
    overrideAccess: true,
  });
}

async function crearUsuario(datos: Pick<Usuario, "rol" | "clienta">): Promise<UsuarioDeTest> {
  const payload = await obtenerPayloadDeTest();
  const usuario = await payload.create({
    collection: "usuarios",
    data: { ...datos, email: `usuario-${siguiente()}@prueba.test`, password: CLAVE_DE_TEST },
    overrideAccess: true,
    user: ADMINISTRADOR_DEL_SISTEMA,
  });
  return { ...usuario, clave: CLAVE_DE_TEST };
}

/** Usuario del panel limitado a esa clienta. Sin argumento: sin clienta asignada. */
export async function crearEditora(clienta?: Clienta): Promise<UsuarioDeTest> {
  return crearUsuario({ rol: "tenant_editor", clienta: clienta?.id ?? null });
}

/** Usuario de Axs con acceso total. */
export async function crearAdministradorAxs(): Promise<UsuarioDeTest> {
  return crearUsuario({ rol: "super_admin", clienta: null });
}

/**
 * La usuaria intenta darse a sí misma acceso total: edita su propio documento, con las reglas de
 * acceso activas, pidiendo el rol de administradora. Si Payload rechaza el cambio, lo ignora: el
 * test comprueba el efecto, no cómo se rechazó.
 */
export async function intentarVolverseAdministradora(usuaria: UsuarioDeTest): Promise<void> {
  const payload = await obtenerPayloadDeTest();
  try {
    await payload.update({
      collection: "usuarios",
      id: usuaria.id,
      data: { rol: "super_admin", clienta: null },
      overrideAccess: false,
      user: { ...usuaria, collection: "usuarios" },
    });
  } catch (error) {
    // Rechazado por acceso o por validación: es lo esperado. Cualquier otro error (un hook o un
    // esquema roto) significa que el intento no se hizo y el test no probaría nada.
    if (!(error instanceof Forbidden) && !(error instanceof ValidationError)) throw error;
  }
}

export async function subirMedio(clienta: Clienta, textoAlternativo?: string): Promise<Medio> {
  const payload = await obtenerPayloadDeTest();
  const imagen = imagenDePrueba();
  return payload.create({
    collection: "medios",
    data: { textoAlternativo: textoAlternativo ?? "Foto de prueba", clienta: clienta.id },
    file: {
      data: imagen.contenido,
      mimetype: imagen.tipo,
      name: imagen.nombre,
      size: imagen.contenido.length,
    },
    overrideAccess: true,
  });
}

export function imagenDePrueba(opciones?: {
  tipo?: TipoImagen;
  bytes?: number; // rellena hasta ese tamaño
  nombre?: string;
}): { nombre: string; tipo: string; contenido: Buffer } {
  const tipo = opciones?.tipo ?? "png";
  const base = IMAGENES_BASE[tipo];
  const relleno = Math.max(0, (opciones?.bytes ?? 0) - base.length);
  return {
    nombre: opciones?.nombre ?? `prueba-${siguiente()}.${tipo}`,
    tipo: TIPOS_MIME[tipo],
    contenido: Buffer.concat([base, Buffer.alloc(relleno)]),
  };
}
