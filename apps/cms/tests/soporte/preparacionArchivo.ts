import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, inject } from "vitest";
import { SECRETO_PAYLOAD_TEST, ejecutarEnServidor, urlDeBase } from "./entorno";

/**
 * Corre antes de cargar cada archivo de test: le da una base propia, clonada de la plantilla
 * migrada, y una carpeta de medios temporal fuera del repo. Al terminar el archivo borra las dos.
 * Todo se fija antes de que el test importe la configuración de Payload, que lee las variables
 * al cargarse. Si el archivo no llega a cargar y este `afterAll` no corre, la base y la carpeta
 * las borra el cierre de la corrida (preparacionGlobal.ts), porque llevan su identificador.
 */

const contador = globalThis as { archivosDeTest?: number };
contador.archivosDeTest = (contador.archivosDeTest ?? 0) + 1;
const baseDelArchivo = `${inject("prefijoBasesCorrida")}${process.pid}_${contador.archivosDeTest}`;

await ejecutarEnServidor(`CREATE DATABASE ${baseDelArchivo} TEMPLATE ${inject("basePlantilla")}`);
const carpetaMedios = await mkdtemp(path.join(inject("carpetaMediosCorrida"), "archivo-"));

process.env["DATABASE_URI"] = urlDeBase(baseDelArchivo);
process.env["PAYLOAD_SECRET"] = SECRETO_PAYLOAD_TEST;
process.env["MEDIA_DIR"] = carpetaMedios;
Object.assign(process.env, { NODE_ENV: "test" });

afterAll(async () => {
  // El test ya cargó las fábricas: este import devuelve el mismo módulo, con su instancia.
  // La carpeta y la base se borran aunque falle el cierre de Payload.
  try {
    const { cerrarPayloadDeTest } = await import("./fabricas");
    await cerrarPayloadDeTest();
  } finally {
    try {
      await ejecutarEnServidor(`DROP DATABASE IF EXISTS ${baseDelArchivo}`);
    } finally {
      await rm(carpetaMedios, { recursive: true, force: true });
    }
  }
});
