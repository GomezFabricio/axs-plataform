import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getPayload } from "payload";
import type { Migration } from "payload";
import type { TestProject } from "vitest/node";
import { migrations } from "@/migrations";
import {
  SECRETO_PAYLOAD_TEST,
  borrarBase,
  cerrarPayload,
  ejecutarEnServidor,
  urlDeBase,
} from "./entorno";

declare module "vitest" {
  interface ProvidedContext {
    /** Base migrada que cada archivo de test clona. */
    basePlantilla: string;
    /** Prefijo de las bases de esta corrida: `axs_test_<id>_`. Las distingue de otras corridas. */
    prefijoBasesCorrida: string;
    /** Carpeta temporal de esta corrida; cada archivo crea adentro la suya de medios. */
    carpetaMediosCorrida: string;
  }
}

/**
 * Arma la base plantilla una sola vez por corrida: la crea vacía y le corre las migraciones.
 * Cada archivo de test la clona (ver preparacionArchivo.ts). Devuelve el cierre de la corrida.
 */
export default async function preparacionGlobal(proyecto: TestProject): Promise<() => Promise<void>> {
  const prefijoBasesCorrida = `axs_test_${randomBytes(4).toString("hex")}_`;
  const basePlantilla = `${prefijoBasesCorrida}plantilla`;

  await ejecutarEnServidor(`CREATE DATABASE ${basePlantilla}`);

  process.env["DATABASE_URI"] = urlDeBase(basePlantilla);
  process.env["PAYLOAD_SECRET"] = SECRETO_PAYLOAD_TEST;
  Object.assign(process.env, { NODE_ENV: "test" });

  let carpetaMediosCorrida: string | undefined;
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

    carpetaMediosCorrida = await mkdtemp(path.join(os.tmpdir(), "axs-medios-test-"));

    proyecto.provide("basePlantilla", basePlantilla);
    proyecto.provide("prefijoBasesCorrida", prefijoBasesCorrida);
    proyecto.provide("carpetaMediosCorrida", carpetaMediosCorrida);
  } catch (error) {
    // Si la preparación falla, Vitest no recibe el cierre: lo armado hasta acá se borra ahora.
    const carpetaCreada = carpetaMediosCorrida;
    const errores = await intentarTodos([
      () => borrarBase(basePlantilla),
      ...(carpetaCreada ? [() => borrarCarpeta(carpetaCreada)] : []),
    ]);
    throw unirErrores([error, ...errores], `Falló la preparación de ${basePlantilla}`);
  }
  const carpetaCorrida = carpetaMediosCorrida;

  /**
   * Cierre de la corrida. Cada archivo borra lo suyo en su `afterAll`; esto es la red para lo que
   * quedó, por ejemplo de un archivo que no llegó a cargar. Solo toca lo de esta corrida. Cada
   * paso corre aunque falle otro, y al final se informan todos los errores.
   */
  return async () => {
    const errores: unknown[] = [];
    let basesDeArchivos: string[] = [];
    try {
      const bases = await ejecutarEnServidor(
        `SELECT datname FROM pg_database WHERE starts_with(datname, '${prefijoBasesCorrida}')`,
      );
      basesDeArchivos = bases
        .map((fila) => String(fila["datname"]))
        .filter((nombre) => nombre !== basePlantilla);
    } catch (error) {
      errores.push(error);
    }
    errores.push(
      ...(await intentarTodos([
        ...basesDeArchivos.map((nombre) => () => borrarBase(nombre)),
        () => borrarBase(basePlantilla),
        () => borrarCarpeta(carpetaCorrida),
      ])),
    );
    if (errores.length > 0) {
      throw unirErrores(errores, `No se pudo limpiar todo lo de la corrida ${prefijoBasesCorrida}`);
    }
  };
}

async function borrarCarpeta(carpeta: string): Promise<void> {
  await rm(carpeta, { recursive: true, force: true });
}

/** Corre todos los pasos aunque alguno falle y devuelve los errores, en orden. */
async function intentarTodos(pasos: Array<() => Promise<void>>): Promise<unknown[]> {
  const errores: unknown[] = [];
  for (const paso of pasos) {
    try {
      await paso();
    } catch (error) {
      errores.push(error);
    }
  }
  return errores;
}

/** Un solo error se informa tal cual; varios, juntos en un AggregateError. */
function unirErrores(errores: unknown[], mensaje: string): unknown {
  return errores.length === 1 ? errores[0] : new AggregateError(errores, mensaje);
}
