import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import { seedSabrina } from "@/seed/sabrina";
import type { Clienta, Medio } from "@/payload-types";
import { crearClienta, crearEditora, imagenDePrueba, obtenerPayloadDeTest } from "../soporte/fabricas";
import type { UsuarioDeTest } from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/**
 * Subida y borrado de medios por HTTP. Estas reglas solo corren en la capa REST: el tope de
 * tamaño (`abortOnLimit`), el filtro de formatos y el borrado protegido de una foto en uso.
 * Las peticiones llaman a los handlers reales con `pedir`; el estado se comprueba después
 * con la API local (`overrideAccess: true`) y mirando la carpeta de medios del archivo.
 */

const MENSAJE_EN_USO =
  "Esta foto está en uso en el sitio. Primero hay que reemplazarla en el contenido.";

/** Tiempo de sobra para las subidas de ~10 MB, que pasan por multipart, validación y escritura. */
const TIEMPO_SUBIDA_GRANDE = 120_000;

let payload: Payload;

function carpetaDeMedios(): string {
  return process.env["MEDIA_DIR"]!;
}

function archivosEnDisco(): string[] {
  return readdirSync(carpetaDeMedios()).sort();
}

async function contarMedios(): Promise<number> {
  const { totalDocs } = await payload.count({ collection: "medios", overrideAccess: true });
  return totalDocs;
}

/** Foto de la clienta subida directo por HTTP, como lo hace su editora desde el panel. */
function subir(
  archivo: { nombre: string; tipo: string; contenido: Buffer },
  como?: UsuarioDeTest,
): Promise<Response> {
  return pedir("POST", "/api/medios", {
    ...(como ? { como } : {}),
    archivo,
    campos: { textoAlternativo: "Foto de prueba" },
  });
}

/**
 * Al cortar un archivo por superar el tope, Payload responde 413 y su parser de multipart deja
 * después una promesa rechazada sin manejar ("Unexpected end of form", de busboy). Es un defecto
 * de la librería, ajeno a este CMS, pero Vitest lo cuenta como error de la corrida. Esta función
 * lo captura mientras corre `accion` y devuelve sus mensajes; así el test sigue fallando ante
 * cualquier otro rechazo inesperado.
 */
async function capturandoRechazosSinManejar<T>(
  accion: () => Promise<T>,
): Promise<{ resultado: T; rechazos: string[] }> {
  const escuchasOriginales = process.listeners("unhandledRejection");
  const rechazos: string[] = [];
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", (motivo) => {
    rechazos.push(motivo instanceof Error ? motivo.message : String(motivo));
  });
  try {
    const resultado = await accion();
    // El rechazo llega después de la respuesta: se espera a que el parser termine.
    await new Promise((resolver) => setTimeout(resolver, 300));
    return { resultado, rechazos };
  } finally {
    process.removeAllListeners("unhandledRejection");
    for (const escucha of escuchasOriginales) process.on("unhandledRejection", escucha);
  }
}

/** Mensajes de error de una respuesta de Payload ({ errors: [{ message }] }). */
async function mensajesDeError(respuesta: Response): Promise<string[]> {
  const cuerpo = (await respuesta.json()) as { errors?: Array<{ message: string }> };
  return (cuerpo.errors ?? []).map((error) => error.message);
}

describe("medios por HTTP", () => {
  let clienta: Clienta;
  let editora: UsuarioDeTest;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
    clienta = await crearClienta({ nombre: "Clienta de medios", slug: "clienta-medios" });
    editora = await crearEditora(clienta);
  });

  describe("subida de formatos permitidos", () => {
    it.each(["png", "jpeg", "webp", "avif"] as const)(
      "acepta una imagen %s y guarda el archivo",
      async (tipo) => {
        const respuesta = await subir(imagenDePrueba({ tipo }), editora);

        expect(respuesta.status).toBe(201);
        const { doc } = (await respuesta.json()) as { doc: Medio };
        expect(doc.filename).toBeTruthy();
        expect(existsSync(path.join(carpetaDeMedios(), doc.filename!))).toBe(true);
      },
    );
  });

  describe("subida rechazada", () => {
    /** Sube el archivo y comprueba que no quedó ni documento ni archivo nuevo. */
    async function subirYVerificarRechazo(
      archivo: { nombre: string; tipo: string; contenido: Buffer },
      subida: () => Promise<Response> = () => subir(archivo, editora),
    ): Promise<Response> {
      const documentosAntes = await contarMedios();
      const archivosAntes = archivosEnDisco();

      const respuesta = await subida();

      expect(respuesta.status).not.toBe(201);
      expect(await contarMedios()).toBe(documentosAntes);
      expect(archivosEnDisco()).toEqual(archivosAntes);
      return respuesta;
    }

    it("rechaza un GIF con 400", async () => {
      const respuesta = await subirYVerificarRechazo(imagenDePrueba({ tipo: "gif" }));
      expect(respuesta.status).toBe(400);
    });

    it("rechaza un SVG con 400", async () => {
      const respuesta = await subirYVerificarRechazo(imagenDePrueba({ tipo: "svg" }));
      expect(respuesta.status).toBe(400);
    });

    it("rechaza un SVG disfrazado de foto.png con tipo image/png", async () => {
      const disfrazado = {
        ...imagenDePrueba({ tipo: "svg", nombre: "foto.png" }),
        tipo: "image/png",
      };
      const respuesta = await subirYVerificarRechazo(disfrazado);
      expect(respuesta.status).toBe(400);
    });

    it(
      "rechaza un PNG de 10.000.001 bytes",
      async () => {
        const demasiadoGrande = imagenDePrueba({ tipo: "png", bytes: 10_000_001 });
        expect(demasiadoGrande.contenido.length).toBe(10_000_001);
        let respuesta: Response | undefined;
        const { rechazos } = await capturandoRechazosSinManejar(async () => {
          respuesta = await subirYVerificarRechazo(demasiadoGrande);
        });

        expect(respuesta?.status).toBe(413);
        expect(rechazos.every((mensaje) => mensaje === "Unexpected end of form")).toBe(true);
      },
      TIEMPO_SUBIDA_GRANDE,
    );

    it("rechaza la subida sin sesión con 403", async () => {
      const documentosAntes = await contarMedios();
      const archivosAntes = archivosEnDisco();

      const respuesta = await subir(imagenDePrueba({ tipo: "png" }));

      expect(respuesta.status).toBe(403);
      expect(await contarMedios()).toBe(documentosAntes);
      expect(archivosEnDisco()).toEqual(archivosAntes);
    });
  });

  describe("tope de tamaño", () => {
    it(
      "acepta un PNG de 9.999.000 bytes",
      async () => {
        const casiElTope = imagenDePrueba({ tipo: "png", bytes: 9_999_000 });
        expect(casiElTope.contenido.length).toBe(9_999_000);

        const respuesta = await subir(casiElTope, editora);

        expect(respuesta.status).toBe(201);
        const { doc } = (await respuesta.json()) as { doc: Medio };
        expect(existsSync(path.join(carpetaDeMedios(), doc.filename!))).toBe(true);
      },
      TIEMPO_SUBIDA_GRANDE,
    );
  });

  describe("lectura pública", () => {
    it("sirve el archivo sin sesión con content-type de imagen", async () => {
      const subida = await subir(imagenDePrueba({ tipo: "png" }), editora);
      const { doc } = (await subida.json()) as { doc: Medio };

      const respuesta = await pedir("GET", `/api/medios/file/${doc.filename}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.headers.get("content-type")).toMatch(/^image\//);
    });
  });

  describe("borrado", () => {
    let editoraSabrina: UsuarioDeTest;
    let medioEnUso: Medio;

    beforeAll(async () => {
      await seedSabrina(payload);
      const { docs } = await payload.find({
        collection: "clientas",
        where: { slug: { equals: "sabrina" } },
        limit: 1,
        overrideAccess: true,
      });
      const sabrina = docs[0]!;
      editoraSabrina = await crearEditora(sabrina);

      // Un medio que el contenido sembrado de verdad referencia: la imagen del "sobre mí".
      const sitio = await payload.findGlobal({ slug: "sitio-sabrina", depth: 0 });
      const idEnUso = sitio.sobreMi.imagen;
      medioEnUso = await payload.findByID({
        collection: "medios",
        id: idEnUso as number,
        overrideAccess: true,
      });
    });

    it("no borra una foto que está en uso en el sitio", async () => {
      const archivo = path.join(carpetaDeMedios(), medioEnUso.filename!);
      expect(existsSync(archivo)).toBe(true);

      const respuesta = await pedir("DELETE", `/api/medios/${medioEnUso.id}`, {
        como: editoraSabrina,
      });

      expect(respuesta.status).toBe(400);
      expect(await mensajesDeError(respuesta)).toContain(MENSAJE_EN_USO);
      const sigue = await payload.findByID({
        collection: "medios",
        id: medioEnUso.id,
        overrideAccess: true,
      });
      expect(sigue.id).toBe(medioEnUso.id);
      expect(existsSync(archivo)).toBe(true);
    });

    it("borra una foto que no está en uso", async () => {
      const subida = await subir(imagenDePrueba({ tipo: "png" }), editoraSabrina);
      expect(subida.status).toBe(201);
      const { doc } = (await subida.json()) as { doc: Medio };
      const archivo = path.join(carpetaDeMedios(), doc.filename!);
      expect(existsSync(archivo)).toBe(true);

      const respuesta = await pedir("DELETE", `/api/medios/${doc.id}`, { como: editoraSabrina });

      expect(respuesta.status).toBe(200);
      const { docs } = await payload.find({
        collection: "medios",
        where: { id: { equals: doc.id } },
        overrideAccess: true,
      });
      expect(docs).toHaveLength(0);
      expect(existsSync(archivo)).toBe(false);
    });
  });
});
