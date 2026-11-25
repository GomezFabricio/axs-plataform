import path from "node:path";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SitioSabrinaSchema } from "@axs/cms-client";
import { sitioSabrina } from "@axs/cms-client/fixtures";
import { seedSabrina } from "@/seed/sabrina";
import { obtenerPayloadDeTest } from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/**
 * Endpoint público `GET /api/sitios/sabrina`, el que lee el sitio de Sabrina. La comparación con
 * el fixture es la red de seguridad de cualquier cambio en cómo se guarda el contenido: si algo
 * cambia en la respuesta, falla acá. Cada test manda una IP propia para no compartir contador.
 */

const RUTA = "/api/sitios/sabrina";
const LIMITE_POR_VENTANA = 60;

type Imagen = { ruta: string; imagen: Record<string, unknown> };

/** Una imagen es cualquier objeto con `url` y `textoAlternativo` (las redes tienen `url` sin texto alternativo). */
function esImagen(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor) &&
    typeof (valor as Record<string, unknown>)["url"] === "string" &&
    typeof (valor as Record<string, unknown>)["textoAlternativo"] === "string"
  );
}

/** Todas las imágenes de una estructura, con la ruta donde está cada una (por ejemplo `hero.escenas.0.imagen`). */
function imagenesDe(valor: unknown, ruta = ""): Imagen[] {
  if (esImagen(valor)) return [{ ruta, imagen: valor }];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => imagenesDe(v, `${ruta}.${i}`));
  if (typeof valor === "object" && valor !== null) {
    return Object.entries(valor).flatMap(([clave, v]) => imagenesDe(v, ruta ? `${ruta}.${clave}` : clave));
  }
  return [];
}

/** Copia de la estructura sin `url`, `ancho` ni `alto` en cada imagen: lo único que depende de dónde se guarda el archivo. */
function sinDatosDelArchivo(valor: unknown): unknown {
  if (esImagen(valor)) {
    const { url: _url, ancho: _ancho, alto: _alto, ...resto } = valor;
    return resto;
  }
  if (Array.isArray(valor)) return valor.map(sinDatosDelArchivo);
  if (typeof valor === "object" && valor !== null) {
    return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [clave, sinDatosDelArchivo(v)]));
  }
  return valor;
}

function restantes(respuesta: Response): number {
  return Number(respuesta.headers.get("X-RateLimit-Remaining"));
}

function desde(ip: string): Promise<Response> {
  return pedir("GET", RUTA, { cabeceras: { "x-forwarded-for": ip } });
}

// Este describe va primero a propósito: la base del archivo nace vacía y el siguiente la carga.
describe("endpoint del sitio sin contenido cargado", () => {
  let payload: Payload;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
  });

  it("no filtra detalles internos cuando el contenido todavía no se cargó", async () => {
    // Precondición: sin ella el test correría contra contenido cargado y no probaría nada.
    const global = await payload.findGlobal({ slug: "sitio-sabrina", overrideAccess: true });
    expect(global.config?.nombre).toBeFalsy();
    expect(global.hero?.escenas ?? []).toHaveLength(0);

    const respuesta = await desde("203.0.113.10");
    const texto = await respuesta.text();

    // Hoy responde 422: el endpoint detecta que falta la configuración básica y lo dice.
    expect(respuesta.status).toBe(422);
    expect(JSON.parse(texto)).toEqual({ error: "Contenido del sitio incompleto" });
    expect(texto).not.toMatch(/stack/i);
    expect(texto).not.toMatch(/\.(ts|js|tsx|mjs)\b/);
    expect(texto).not.toMatch(/\/(Users|home|node_modules|src)\//);
    expect(texto).not.toMatch(/\b(select|insert|update|from|where)\b/i);
  });
});

describe("endpoint del sitio con el contenido cargado", () => {
  beforeAll(async () => {
    await seedSabrina(await obtenerPayloadDeTest());
  });

  it("responde 200 y el cuerpo cumple el contrato del sitio", async () => {
    const respuesta = await desde("203.0.113.20");

    expect(respuesta.status).toBe(200);
    const cuerpo: unknown = await respuesta.json();
    expect(() => SitioSabrinaSchema.parse(cuerpo)).not.toThrow();
  });

  it("no devuelve ningún campo fuera del contrato", async () => {
    const respuesta = await desde("203.0.113.23");
    const cuerpoCrudo: unknown = await respuesta.json();

    // El esquema descarta las claves que no conoce: si el cuerpo crudo trae alguna de más (por
    // ejemplo la clienta de un medio o un campo interno), deja de ser igual a su versión validada.
    expect(cuerpoCrudo).toEqual(SitioSabrinaSchema.parse(cuerpoCrudo));
  });

  it("devuelve el mismo contenido que el fixture de referencia", async () => {
    const respuesta = await desde("203.0.113.21");
    const cuerpo = SitioSabrinaSchema.parse(await respuesta.json());
    const referencia = SitioSabrinaSchema.parse(sitioSabrina);

    expect(sinDatosDelArchivo(cuerpo)).toEqual(sinDatosDelArchivo(referencia));
  });

  it("cada imagen conserva su archivo, su texto alternativo y sus medidas", async () => {
    const respuesta = await desde("203.0.113.22");
    const cuerpo = SitioSabrinaSchema.parse(await respuesta.json());
    const esperadas = imagenesDe(SitioSabrinaSchema.parse(sitioSabrina));
    const recibidas = imagenesDe(cuerpo);

    // El recorrido tiene que haber visitado todas las imágenes: si no, el test pasaría sin mirar nada.
    expect(esperadas.length).toBeGreaterThan(0);
    expect(recibidas.length).toBe(esperadas.length);
    expect(recibidas.map((i) => i.ruta)).toEqual(esperadas.map((i) => i.ruta));

    esperadas.forEach((esperada, indice) => {
      const { ruta, imagen } = recibidas[indice]!;
      const archivo = path.basename(esperada.imagen["url"] as string);
      expect(String(imagen["url"]).endsWith(`/${archivo}`), `url de ${ruta}: ${String(imagen["url"])}`).toBe(true);
      expect(imagen["textoAlternativo"], `textoAlternativo de ${ruta}`).toBe(esperada.imagen["textoAlternativo"]);
      expect(imagen["ancho"], `ancho de ${ruta}`).toBeGreaterThan(0);
      expect(imagen["alto"], `alto de ${ruta}`).toBeGreaterThan(0);
    });
  });

  it("la URL de cada imagen apunta al CMS y sirve el archivo", async () => {
    const payload = await obtenerPayloadDeTest();
    const respuesta = await desde("203.0.113.24");
    const recibidas = imagenesDe(SitioSabrinaSchema.parse(await respuesta.json()));
    expect(recibidas.length).toBe(imagenesDe(SitioSabrinaSchema.parse(sitioSabrina)).length);

    // El sitio usa `url` tal cual como `src`: tiene que llevar al archivo servido por este CMS.
    const origenDelCms = new URL(payload.config.serverURL).origin;
    for (const { ruta, imagen } of recibidas) {
      const url = new URL(String(imagen["url"]));
      expect(url.origin, `origen de ${ruta}: ${url.href}`).toBe(origenDelCms);

      const archivo = await pedir("GET", url.pathname);
      expect(archivo.status, `GET ${url.pathname} (${ruta})`).toBe(200);
      expect(archivo.headers.get("content-type"), `content-type de ${ruta}`).toMatch(/^image\//);
    }
  });

  describe("límite de peticiones por IP", () => {
    it("atiende 60 peticiones desde la misma IP y la última avisa que no quedan", async () => {
      const ip = "203.0.113.30";
      const respuestas: Response[] = [];
      for (let i = 0; i < LIMITE_POR_VENTANA; i += 1) respuestas.push(await desde(ip));

      expect(respuestas.map((r) => r.status)).toEqual(Array(LIMITE_POR_VENTANA).fill(200));
      expect(restantes(respuestas[0]!)).toBe(LIMITE_POR_VENTANA - 1);
      expect(respuestas.at(-1)!.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("rechaza la petición 61 de esa IP, pero atiende a otra", async () => {
      const ip = "203.0.113.31";
      for (let i = 0; i < LIMITE_POR_VENTANA; i += 1) await desde(ip);

      const rechazada = await desde(ip);
      expect(rechazada.status).toBe(429);
      expect(await rechazada.json()).toEqual({ error: "Demasiadas solicitudes" });
      const espera = Number(rechazada.headers.get("Retry-After"));
      expect(espera).toBeGreaterThanOrEqual(1);
      expect(espera).toBeLessThanOrEqual(60);

      expect((await desde("203.0.113.32")).status).toBe(200);
    });

    it("cuenta juntas las peticiones sin IP, porque comparten una misma clave", async () => {
      // Es el único test de este archivo que no manda cabeceras de IP.
      const primera = await pedir("GET", RUTA);
      const segunda = await pedir("GET", RUTA);

      expect(primera.status).toBe(200);
      expect(segunda.status).toBe(200);
      expect(restantes(segunda)).toBe(restantes(primera) - 1);
    });

    it("con varias direcciones en x-forwarded-for cuenta sobre la primera", async () => {
      const primera = await desde("203.0.113.40, 203.0.113.41");
      const sobreLaPrimeraSola = await desde("203.0.113.40");
      const sobreLaSegundaSola = await desde("203.0.113.41");

      expect(restantes(primera)).toBe(LIMITE_POR_VENTANA - 1);
      expect(restantes(sobreLaPrimeraSola)).toBe(LIMITE_POR_VENTANA - 2);
      // La segunda dirección nunca se contó: empieza de cero.
      expect(restantes(sobreLaSegundaSola)).toBe(LIMITE_POR_VENTANA - 1);
    });
  });
});

describe("endpoint del sitio cuando falla la lectura del contenido", () => {
  it("responde 500 con un mensaje genérico, sin el detalle del error", async () => {
    const payload = await obtenerPayloadDeTest();
    // El handler usa la misma instancia de Payload que el test: el espía le hace fallar la lectura.
    const lectura = vi
      .spyOn(payload, "findGlobal")
      .mockRejectedValueOnce(new Error('select "config_nombre" from "sitio_sabrina" falló en /app/src/x.ts'));
    // El handler registra el error: se lo silencia para que el detalle falso no ensucie la salida.
    const registro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const respuesta = await desde("203.0.113.50");

      expect(lectura).toHaveBeenCalledTimes(1);
      expect(respuesta.status).toBe(500);
      expect(await respuesta.json()).toEqual({ error: "No se pudo obtener el sitio" });
    } finally {
      lectura.mockRestore();
      registro.mockRestore();
    }
  });
});
