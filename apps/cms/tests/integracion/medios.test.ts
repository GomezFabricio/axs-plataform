import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
 * Los dos rechazos sin manejar que deja Payload al cortar un archivo por superar el tope: el de
 * su propio control de tamaño y el de busboy al quedar el formulario a medias. Cuál de los dos
 * llega, o si llegan ambos, depende del sistema: en macOS se vio el segundo y en el Linux del CI
 * el primero.
 */
const RECHAZOS_CONOCIDOS_DEL_TOPE = ["File size limit has been reached", "Unexpected end of form"];

/**
 * Al cortar un archivo por superar el tope, Payload responde 413 y su parser de multipart deja
 * después alguna promesa rechazada sin manejar. Es un defecto de la librería, ajeno a este CMS,
 * pero Vitest lo cuenta como error de la corrida. Mientras dura el archivo, estos listeners lo
 * recogen en `rechazosSinManejar`; `afterAll` exige que todo lo recogido sea exactamente uno de
 * los mensajes conocidos, así cualquier otro rechazo inesperado sigue fallando.
 */
const rechazosSinManejar: string[] = [];
let escuchasOriginales: NodeJS.UnhandledRejectionListener[] = [];

function empezarACapturarRechazosSinManejar(): void {
  escuchasOriginales = process.rawListeners("unhandledRejection") as NodeJS.UnhandledRejectionListener[];
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", (motivo) => {
    rechazosSinManejar.push(motivo instanceof Error ? motivo.message : String(motivo));
  });
}

function dejarDeCapturarRechazosSinManejar(): void {
  process.removeAllListeners("unhandledRejection");
  for (const escucha of escuchasOriginales) process.on("unhandledRejection", escucha);
}

/**
 * Espera a que el parser termine de cortar la subida, que se nota porque llega su rechazo. No es
 * una pausa fija: vuelve apenas llega, y solo si no llega (por ejemplo, si la librería arregla
 * el defecto) sigue hasta el tope y lo da por terminado.
 */
async function esperarCierreDelParser(rechazosPrevios: number): Promise<void> {
  const limite = Date.now() + 10_000;
  while (rechazosSinManejar.length <= rechazosPrevios && Date.now() < limite) {
    await new Promise((resolver) => setTimeout(resolver, 20));
  }
}

/**
 * Medios poblados dentro del contenido del sitio, con la ruta donde aparece cada uno (por ejemplo
 * `experiencias.experiencias.0.imagen`). Reconoce un medio por su forma (archivo y tipo), no por el
 * nombre del campo que lo contiene, para seguir encontrándolos si cambia cómo se guarda el sitio.
 */
function mediosReferenciados(valor: unknown, ruta = ""): Array<{ ruta: string; medio: Medio }> {
  if (typeof valor !== "object" || valor === null) return [];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => mediosReferenciados(v, `${ruta}.${i}`));
  const objeto = valor as Record<string, unknown>;
  if (typeof objeto["filename"] === "string" && typeof objeto["mimeType"] === "string") {
    return [{ ruta, medio: valor as Medio }];
  }
  return Object.entries(objeto).flatMap(([clave, v]) =>
    mediosReferenciados(v, ruta ? `${ruta}.${clave}` : clave),
  );
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

  beforeAll(empezarACapturarRechazosSinManejar);

  afterAll(() => {
    dejarDeCapturarRechazosSinManejar();
    expect(rechazosSinManejar.filter((mensaje) => !RECHAZOS_CONOCIDOS_DEL_TOPE.includes(mensaje))).toEqual([]);
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
    /**
     * Sube el archivo (con sesión, salvo `sinSesion`) y comprueba que no quedó ni documento ni
     * archivo nuevo. `esperarAntesDeContar` deja terminar trabajo posterior a la respuesta antes
     * de mirar la base y el disco.
     */
    async function subirYVerificarRechazo(
      archivo: { nombre: string; tipo: string; contenido: Buffer },
      opciones?: { sinSesion?: boolean; esperarAntesDeContar?: () => Promise<void> },
    ): Promise<Response> {
      const documentosAntes = await contarMedios();
      const archivosAntes = archivosEnDisco();

      const respuesta = await subir(archivo, opciones?.sinSesion ? undefined : editora);
      await opciones?.esperarAntesDeContar?.();

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
        const rechazosPrevios = rechazosSinManejar.length;

        const respuesta = await subirYVerificarRechazo(demasiadoGrande, {
          esperarAntesDeContar: () => esperarCierreDelParser(rechazosPrevios),
        });

        expect(respuesta.status).toBe(413);
      },
      TIEMPO_SUBIDA_GRANDE,
    );

    it("rechaza la subida sin sesión con 403", async () => {
      const respuesta = await subirYVerificarRechazo(imagenDePrueba({ tipo: "png" }), {
        sinSesion: true,
      });
      expect(respuesta.status).toBe(403);
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
    });

    it("no borra ninguna de las fotos que usa el sitio", async () => {
      // Las fotos en uso salen del contenido sembrado, recorrido entero: no de una lista fija.
      const sitio = await payload.findGlobal({ slug: "sitio-sabrina", depth: 1, overrideAccess: true });
      const referencias = mediosReferenciados(sitio);
      const enUso = new Map(referencias.map(({ medio }) => [medio.id, medio]));

      // El contenido sembrado usa 5 archivos en 7 lugares. Si el recorrido no los encontrara a
      // todos, el test pasaría sin haber probado nada.
      expect(referencias).toHaveLength(7);
      expect(enUso.size).toBe(5);

      for (const medio of enUso.values()) {
        const lugares = referencias
          .filter((referencia) => referencia.medio.id === medio.id)
          .map((referencia) => referencia.ruta)
          .join(", ");
        const archivo = path.join(carpetaDeMedios(), medio.filename!);
        expect(existsSync(archivo), `archivo de ${medio.filename} antes de borrar`).toBe(true);

        const respuesta = await pedir("DELETE", `/api/medios/${medio.id}`, { como: editoraSabrina });

        // `soft`: si una foto queda sin proteger, el fallo nombra todas las que quedaron así.
        expect.soft(respuesta.status, `borrado de ${medio.filename} (en uso en ${lugares})`).toBe(400);
        expect.soft(await mensajesDeError(respuesta), `mensaje para ${medio.filename}`).toContain(MENSAJE_EN_USO);
        const { totalDocs } = await payload.count({
          collection: "medios",
          where: { id: { equals: medio.id } },
          overrideAccess: true,
        });
        expect.soft(totalDocs, `documento de ${medio.filename}`).toBe(1);
        expect.soft(existsSync(archivo), `archivo de ${medio.filename} después de borrar`).toBe(true);
      }
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
