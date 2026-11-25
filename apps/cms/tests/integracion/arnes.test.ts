import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { migrations } from "@/migrations";
import { crearClienta, obtenerPayloadDeTest, subirMedio } from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/** Comprueba los supuestos del arnés: base migrada, API local, handlers sin servidor y medios aparte. */
describe("arnés de tests", () => {
  it("la base del archivo se armó con todas las migraciones y sin push", async () => {
    const payload = await obtenerPayloadDeTest();
    const { docs } = await payload.find({
      collection: "payload-migrations",
      pagination: false,
      overrideAccess: true,
    });
    // Exactamente las del arreglo de migraciones, ni una más ni una menos.
    expect(docs.map((d) => d.name).sort()).toEqual(migrations.map((m) => m.name).sort());
    // `push` deja una fila con batch -1: si apareciera, el esquema no salió de las migraciones.
    expect(docs.filter((d) => d.batch === -1)).toEqual([]);
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
