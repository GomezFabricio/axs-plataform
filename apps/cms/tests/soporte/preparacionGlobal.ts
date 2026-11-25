import { getPayload } from "payload";
import type { Migration } from "payload";
import type { TestProject } from "vitest/node";
import { migrations } from "@/migrations";
import {
  SECRETO_PAYLOAD_TEST,
  cerrarPayload,
  ejecutarEnServidor,
  urlDeBase,
} from "./entorno";

declare module "vitest" {
  interface ProvidedContext {
    /** Base migrada que cada archivo de test clona. */
    basePlantilla: string;
  }
}

/**
 * Arma la base plantilla una sola vez por corrida: la crea vacía y le corre las migraciones.
 * Cada archivo de test la clona (ver preparacionArchivo.ts). Devuelve el cierre que la borra.
 */
export default async function preparacionGlobal(proyecto: TestProject): Promise<() => Promise<void>> {
  const basePlantilla = `axs_test_plantilla_${process.pid}`;

  await ejecutarEnServidor(`DROP DATABASE IF EXISTS ${basePlantilla}`);
  await ejecutarEnServidor(`CREATE DATABASE ${basePlantilla}`);

  process.env["DATABASE_URI"] = urlDeBase(basePlantilla);
  process.env["PAYLOAD_SECRET"] = SECRETO_PAYLOAD_TEST;
  Object.assign(process.env, { NODE_ENV: "test" });

  const borrarPlantilla = async (): Promise<void> => {
    await ejecutarEnServidor(`DROP DATABASE IF EXISTS ${basePlantilla}`);
  };

  try {
    // La configuración lee las variables al cargarse: se importa después de fijarlas.
    const { default: config } = await import("@payload-config");
    const payload = await getPayload({ config });
    try {
      // El tipo genérico de Payload declara `up(args: unknown)`; las migraciones del adaptador
      // Postgres reciben `MigrateUpArgs`, que es lo que Payload les pasa al correrlas.
      await payload.db.migrate({ migrations: migrations as unknown as Migration[] });
    } finally {
      await cerrarPayload(payload);
    }
  } catch (error) {
    // Si la plantilla no llega a armarse, Vitest no recibe el cierre: se borra acá. El pid
    // cambia en cada corrida, así que el DROP del arranque siguiente no la encontraría.
    await borrarPlantilla().catch((errorAlBorrar: unknown) => {
      throw new AggregateError(
        [error, errorAlBorrar],
        `No se pudo armar ${basePlantilla} y tampoco borrarla`,
      );
    });
    throw error;
  }

  proyecto.provide("basePlantilla", basePlantilla);

  return borrarPlantilla;
}
