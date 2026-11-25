/*
 * Limpieza manual. El arnés borra lo suyo al terminar, al fallar la preparación y ante Ctrl-C o
 * SIGTERM. Si una corrida murió sin poder limpiar (kill -9, un corte), esto borra las bases y las
 * carpetas de medios de TODAS las corridas, así que se usa sin ninguna corrida de tests en marcha:
 *
 *   docker exec -i cms-postgres-1 psql -U axs -d postgres <<'SQL'
 *   SELECT format('DROP DATABASE %I WITH (FORCE)', datname) FROM pg_database WHERE datname LIKE 'axs\_test\_%' \gexec
 *   SQL
 *   rm -rf "${TMPDIR:-/tmp}"/axs-medios-test-*
 */

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

/** `process.exit` tal como estaba al cargar el arnés: es el que se restaura y el que termina el proceso. */
const SALIR_DEL_PROCESO = process.exit;

const SENALES_DE_CORTE = ["SIGINT", "SIGTERM"] as const;

/**
 * Arma la base plantilla una sola vez por corrida: la crea vacía y le corre las migraciones.
 * Cada archivo de test la clona (ver preparacionArchivo.ts). Devuelve el cierre de la corrida.
 *
 * Lo de la corrida se borra siempre con la misma limpieza, que corre una sola vez: en el cierre
 * normal, si falla la preparación y si llega Ctrl-C o SIGTERM a mitad de la corrida.
 */
export default async function preparacionGlobal(proyecto: TestProject): Promise<() => Promise<void>> {
  const prefijoBasesCorrida = `axs_test_${randomBytes(4).toString("hex")}_`;
  const basePlantilla = `${prefijoBasesCorrida}plantilla`;

  await ejecutarEnServidor(`CREATE DATABASE ${basePlantilla}`);

  let carpetaMediosCorrida: string | undefined;
  let limpieza: Promise<unknown[]> | undefined;
  const limpiar = (): Promise<unknown[]> =>
    (limpieza ??= limpiarCorrida(prefijoBasesCorrida, basePlantilla, () => carpetaMediosCorrida));
  const dejarDeEscuchar = limpiarAnteUnCorte(limpiar);

  try {
    carpetaMediosCorrida = await mkdtemp(path.join(os.tmpdir(), "axs-medios-test-"));

    process.env["DATABASE_URI"] = urlDeBase(basePlantilla);
    process.env["PAYLOAD_SECRET"] = SECRETO_PAYLOAD_TEST;
    Object.assign(process.env, { NODE_ENV: "test" });

    // La configuración lee las variables al cargarse: se importa después de fijarlas.
    const { default: config } = await import("@payload-config");
    const payload = await getPayload({ config });
    try {
      // El tipo genérico de Payload declara `up(args: unknown)`; las migraciones del adaptador
      // Postgres reciben `MigrateUpArgs`, que es lo que Payload les pasa al correrlas.
      await sinTerminarElProceso(() =>
        payload.db.migrate({ migrations: migrations as unknown as Migration[] }),
      );
    } finally {
      await cerrarPayload(payload);
    }

    proyecto.provide("basePlantilla", basePlantilla);
    proyecto.provide("prefijoBasesCorrida", prefijoBasesCorrida);
    proyecto.provide("carpetaMediosCorrida", carpetaMediosCorrida);
  } catch (error) {
    // Si la preparación falla, Vitest no recibe el cierre: lo armado hasta acá se borra ahora.
    dejarDeEscuchar();
    const errores = await limpiar();
    throw unirErrores([error, ...errores], `Falló la preparación de ${basePlantilla}`);
  }

  /**
   * Cierre de la corrida. Cada archivo borra lo suyo en su `afterAll`; esto es la red para lo que
   * quedó, por ejemplo de un archivo que no llegó a cargar. Solo toca lo de esta corrida.
   */
  return async () => {
    dejarDeEscuchar();
    const errores = await limpiar();
    if (errores.length > 0) {
      throw unirErrores(errores, `No se pudo limpiar todo lo de la corrida ${prefijoBasesCorrida}`);
    }
  };
}

/**
 * Borra las bases de la corrida (las de los archivos y la plantilla) y su carpeta de medios. Cada
 * paso corre aunque falle otro; devuelve los errores en vez de lanzarlos.
 */
async function limpiarCorrida(
  prefijoBasesCorrida: string,
  basePlantilla: string,
  carpetaMediosCorrida: () => string | undefined,
): Promise<unknown[]> {
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
  const carpeta = carpetaMediosCorrida();
  errores.push(
    ...(await intentarTodos([
      ...basesDeArchivos.map((nombre) => () => borrarBase(nombre)),
      () => borrarBase(basePlantilla),
      ...(carpeta ? [() => borrarCarpeta(carpeta)] : []),
    ])),
  );
  return errores;
}

/**
 * Ante Ctrl-C o SIGTERM corre la limpieza y después termina el proceso con el código de esa señal
 * (130 o 143). Vitest también escucha esas señales y termina el proceso enseguida, sin esperar al
 * cierre de la corrida: por eso, mientras dura la limpieza, `process.exit` no hace nada. Un segundo
 * Ctrl-C ya no encuentra a nadie escuchando y corta en el acto. Devuelve la función que deja de
 * escuchar, que el cierre normal llama antes de limpiar.
 */
function limpiarAnteUnCorte(limpiar: () => Promise<unknown[]>): () => void {
  const alRecibirLaSenal = (senal: NodeJS.Signals): void => {
    dejarDeEscuchar();
    process.exit = (() => undefined) as typeof process.exit;
    void limpiar()
      .then((errores) => {
        for (const error of errores) console.error(`No se pudo limpiar todo tras ${senal}:`, error);
      })
      .finally(() => {
        process.exit = SALIR_DEL_PROCESO;
        process.exitCode = 128 + os.constants.signals[senal];
        process.exit();
      });
  };
  function dejarDeEscuchar(): void {
    for (const senal of SENALES_DE_CORTE) process.off(senal, alRecibirLaSenal);
  }
  for (const senal of SENALES_DE_CORTE) process.on(senal, alRecibirLaSenal);
  return dejarDeEscuchar;
}

/**
 * Corre el paso con `process.exit` cambiado por una función que lanza. Las migraciones de Payload
 * (`runMigrationFile` de `@payloadcms/drizzle`) llaman a `process.exit(1)` cuando una falla, y a
 * `process.exit(0)` si encuentran una base armada con `push`: lo primero se saltearía la limpieza
 * y lo segundo daría una corrida en verde sin tests. Así las dos llegan como error a quien llama.
 * `process.exit` se restaura pase lo que pase, salvo que una señal lo haya tomado mientras tanto:
 * en ese caso lo restaura la limpieza de la señal, que termina el proceso.
 */
async function sinTerminarElProceso<T>(paso: () => Promise<T>): Promise<T> {
  const anterior = process.exit;
  const lanzar = ((codigo?: number | string | null) => {
    throw new Error(
      `Las migraciones intentaron terminar el proceso con process.exit(${codigo ?? ""}). ` +
        "El motivo está en el registro de Payload, más arriba.",
    );
  }) as typeof process.exit;
  process.exit = lanzar;
  try {
    return await paso();
  } finally {
    if (process.exit === lanzar) process.exit = anterior;
  }
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
