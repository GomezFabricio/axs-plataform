import path from "node:path";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import { sitioSabrina } from "@axs/cms-client/fixtures";
import { seedSabrina } from "@/seed/sabrina";
import { obtenerPayloadDeTest } from "../soporte/fabricas";

/**
 * Carga inicial del contenido de Sabrina. Repetirla no debe duplicar clientas, fotos ni
 * contenido: es lo que permite volver a correr el seed sin ensuciar una base ya cargada.
 */

/** Nombres de archivo distintos entre las imágenes del fixture (hero-1 y hero-2 se repiten). */
function archivosDelFixture(): Set<string> {
  const archivos = new Set<string>();
  const recorrer = (valor: unknown): void => {
    if (Array.isArray(valor)) valor.forEach(recorrer);
    else if (typeof valor === "object" && valor !== null) {
      const objeto = valor as Record<string, unknown>;
      if (typeof objeto["textoAlternativo"] === "string" && typeof objeto["url"] === "string") {
        archivos.add(path.basename(objeto["url"]));
      } else {
        Object.values(objeto).forEach(recorrer);
      }
    }
  };
  recorrer(sitioSabrina);
  return archivos;
}

async function contar(payload: Payload): Promise<{ clientas: number; medios: number }> {
  const clientas = await payload.count({ collection: "clientas", overrideAccess: true });
  const medios = await payload.count({ collection: "medios", overrideAccess: true });
  return { clientas: clientas.totalDocs, medios: medios.totalDocs };
}

/**
 * Contenido del sitio sin lo que Payload regenera en cada guardado: las fechas y los ids de
 * las filas de cada lista. Lo que queda es el contenido y los ids de las fotos referenciadas.
 */
async function contenidoDelSitio(payload: Payload): Promise<unknown> {
  const sitio = await payload.findGlobal({ slug: "sitio-sabrina", depth: 0, overrideAccess: true });
  const limpiar = (valor: unknown): unknown => {
    if (Array.isArray(valor)) return valor.map(limpiar);
    if (typeof valor === "object" && valor !== null) {
      return Object.fromEntries(
        Object.entries(valor)
          .filter(([clave]) => !["id", "createdAt", "updatedAt"].includes(clave))
          .map(([clave, resto]) => [clave, limpiar(resto)]),
      );
    }
    return valor;
  };
  return limpiar(sitio);
}

describe("carga inicial de Sabrina", () => {
  let payload: Payload;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
  });

  it("carga el contenido de Sabrina y repetirla no duplica nada", async () => {
    await seedSabrina(payload);
    const antes = await contar(payload);
    const contenidoAntes = await contenidoDelSitio(payload);

    await seedSabrina(payload);

    expect(await contar(payload)).toEqual(antes);
    expect(await contenidoDelSitio(payload)).toEqual(contenidoAntes);
    expect(antes.clientas).toBe(1);
    // Una foto por archivo distinto del fixture: las que se repiten entre secciones se reusan.
    expect(antes.medios).toBe(archivosDelFixture().size);
    expect(antes.medios).toBeGreaterThan(0);
  });
});
