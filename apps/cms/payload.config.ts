import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";
import { Clientas } from "./src/collections/Clientas";
import { Usuarios } from "./src/collections/Usuarios";
import { Medios } from "./src/collections/Medios";
import { SitioSabrina } from "./src/globals/SitioSabrina";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: __dirname,
    },
  },
  collections: [Clientas, Usuarios, Medios],
  globals: [SitioSabrina],
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env["DATABASE_URI"] ?? "",
    },
    // En desarrollo se puede usar push: true para crear/actualizar el esquema sin migrar.
    // En producción desactivar esto y usar las migraciones generadas.
    push: process.env["NODE_ENV"] !== "production",
    migrationDir: path.resolve(__dirname, "src/migrations"),
  }),
  secret: process.env["PAYLOAD_SECRET"] ?? "",
  typescript: {
    outputFile: path.resolve(__dirname, "src/payload-types.ts"),
  },
  serverURL: process.env["PAYLOAD_SERVER_URL"] ?? "http://localhost:3001",
});
