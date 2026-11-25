import pg from "pg";
import type { Payload } from "payload";

/** Servidor Postgres de los tests (sin base). Se cambia con TEST_POSTGRES_URL. */
export const URL_POSTGRES_TEST: string =
  process.env["TEST_POSTGRES_URL"] ?? "postgres://axs:axsdev@localhost:5432";

/** Secreto fijo de Payload para los tests: firma los tokens de sesión. */
export const SECRETO_PAYLOAD_TEST = "secreto-de-test-no-usar-fuera-de-los-tests";

/** URL de conexión a una base concreta del servidor de test. */
export function urlDeBase(nombreBase: string): string {
  const url = new URL(URL_POSTGRES_TEST);
  url.pathname = `/${nombreBase}`;
  return url.toString();
}

/** URL del servidor sin la clave, para mensajes de error. */
function urlSinClave(): string {
  const url = new URL(URL_POSTGRES_TEST);
  url.password = "";
  return url.toString();
}

/** Conexión rechazada o host inexistente: no hay un Postgres escuchando en la URL de test. */
function esPostgresAusente(error: unknown): boolean {
  const codigo = (error as { code?: unknown } | null)?.code;
  return codigo === "ECONNREFUSED" || codigo === "ENOTFOUND";
}

/**
 * Corre una sentencia en la base `postgres` del servidor de test (crear y borrar bases).
 * Si no hay Postgres en esa dirección, falla con un mensaje que dice cómo levantarlo; cualquier
 * otro error de conexión (clave, base, URL mal escrita) sale tal cual.
 */
export async function ejecutarEnServidor(sentencia: string): Promise<pg.QueryResultRow[]> {
  const cliente = new pg.Client({ connectionString: urlDeBase("postgres") });
  try {
    await cliente.connect();
  } catch (error) {
    if (!esPostgresAusente(error)) throw error;
    throw new Error(
      `No hay Postgres en ${urlSinClave()}. Levantalo con: docker compose -f apps/cms/docker-compose.yml up -d`,
      { cause: error },
    );
  }
  try {
    const { rows } = await cliente.query(sentencia);
    return rows;
  } finally {
    await cliente.end();
  }
}

/**
 * Termina todas las conexiones a esa base, para poder clonarla o borrarla. El corte es
 * deliberado y total, no solo la conexión de Payload: estas bases son de los tests y nadie más
 * debe estar conectado.
 */
export async function cortarConexiones(nombreBase: string): Promise<void> {
  await ejecutarEnServidor(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${nombreBase}'`,
  );
}

/** Borra la base si existe, cortando antes las conexiones que le queden. */
export async function borrarBase(nombreBase: string): Promise<void> {
  await cortarConexiones(nombreBase);
  await ejecutarEnServidor(`DROP DATABASE IF EXISTS ${nombreBase}`);
}

/**
 * Cierra la conexión de Payload a su base, para poder clonarla o borrarla después.
 * `payload.destroy()` solo limpia el adaptador y deja el pool de `pg` abierto. `pool.end()`
 * cierra los clientes libres pero no se espera: queda colgado para siempre, porque el adaptador
 * toma un cliente al conectar y nunca lo libera. Ese último se corta desde el servidor con
 * `cortarConexiones`, que termina todas las conexiones a esa base, de forma deliberada.
 */
export async function cerrarPayload(payload: Payload): Promise<void> {
  const nombreBase = new URL(payload.db.poolOptions.connectionString ?? "").pathname.slice(1);
  await payload.destroy();
  // No se espera y su rechazo se ignora a propósito: el corte de abajo cierra igual lo que quede.
  payload.db.pool.end().catch(() => undefined);
  await cortarConexiones(nombreBase);
}
