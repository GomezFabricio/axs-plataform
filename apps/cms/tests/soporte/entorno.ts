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

/**
 * Corre una sentencia en la base `postgres` del servidor de test (crear y borrar bases).
 * Si Postgres no responde, falla con un mensaje que dice cómo levantarlo.
 */
export async function ejecutarEnServidor(sentencia: string): Promise<void> {
  const cliente = new pg.Client({ connectionString: urlDeBase("postgres") });
  try {
    await cliente.connect();
  } catch (error) {
    throw new Error(
      `No hay Postgres en ${urlSinClave()}. Levantalo con: docker compose -f apps/cms/docker-compose.yml up -d`,
      { cause: error },
    );
  }
  try {
    await cliente.query(sentencia);
  } finally {
    await cliente.end();
  }
}

/**
 * Cierra la conexión de Payload a su base, para poder clonarla o borrarla después.
 * `payload.destroy()` solo limpia el adaptador y deja el pool de `pg` abierto. `pool.end()`
 * cierra los clientes libres pero no se espera: queda colgado para siempre, porque el adaptador
 * toma un cliente al conectar y nunca lo libera. Ese último se corta desde el servidor.
 */
export async function cerrarPayload(payload: Payload): Promise<void> {
  const nombreBase = new URL(payload.db.poolOptions.connectionString ?? "").pathname.slice(1);
  await payload.destroy();
  void payload.db.pool.end();
  await ejecutarEnServidor(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${nombreBase}'`,
  );
}
