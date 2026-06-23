import { getPayload } from "payload";
import configPromise from "../../payload.config.js";
import { seedSabrina } from "./sabrina.js";

/**
 * Runner del seed. Ejecutar con:
 *   pnpm --filter @axs/cms cms:seed
 *
 * Idempotente: re-correrlo no duplica datos.
 * Requiere DATABASE_URI y PAYLOAD_SECRET en el entorno (leer de .env antes de invocar).
 */
async function main(): Promise<void> {
  const payload = await getPayload({ config: configPromise });

  payload.logger.info("Iniciando seed de Sabrina...");
  await seedSabrina(payload);
  payload.logger.info("Seed completado");

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Error en el seed:", err);
  process.exit(1);
});
