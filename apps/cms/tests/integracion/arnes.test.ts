import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { crearClienta, obtenerPayloadDeTest, subirMedio } from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/** Comprueba los supuestos del arnés: base migrada, API local, handlers sin servidor y medios aparte. */
describe("arnés de tests", () => {
  it("la base del archivo se armó con las migraciones", async () => {
    const payload = await obtenerPayloadDeTest();
    const { docs } = await payload.find({ collection: "payload-migrations", limit: 10 });
    expect(docs.map((d) => d.name)).toEqual(
      expect.arrayContaining(["20260624_000000_baseline", "20261123_000000_imagenes_upload"]),
    );
  });

  it("la API local crea y lee una clienta", async () => {
    const clienta = await crearClienta({ slug: "prueba-arnes" });
    expect(clienta.slug).toBe("prueba-arnes");
  });

  it("los handlers responden sin servidor", async () => {
    const respuesta = await pedir("GET", "/api/clientas");
    expect(respuesta.status).toBe(403);
  });

  it("los medios de test no van a la carpeta del repo", async () => {
    const clienta = await crearClienta();
    const medio = await subirMedio(clienta);
    expect(existsSync(path.join(process.env.MEDIA_DIR!, medio.filename!))).toBe(true);
    expect(existsSync(path.join("media", medio.filename!))).toBe(false);
  });
});
