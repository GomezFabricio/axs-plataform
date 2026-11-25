import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Las imágenes del global sitio-sabrina pasan de texto (url + texto alternativo) a campos
 * upload que apuntan a `medios`, para que la clienta las suba desde el panel.
 *
 * Contenido existente: cada imagen se enlaza con el medio cuyo `filename` coincide con el
 * nombre de archivo de su url (ej. /assets/hero-1.png -> hero-1.png). En una base con
 * contenido, subir antes esos archivos a `medios`. Si queda alguna imagen sin medio, la
 * migración se detiene sin cambiar nada (corre en una transacción).
 *
 * Escrita a mano: `payload migrate:create` falla con tsx 4.22.4 + Node 26. El DDL replica
 * el que genera el push de Payload para los campos upload (validado contra ese esquema).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "sitio_sabrina_hero_escenas" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "sobre_mi_imagen_id" integer;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "pack_imagen_id" integer;

  UPDATE "sitio_sabrina_hero_escenas" t SET "imagen_id" = m."id"
    FROM "medios" m WHERE m."filename" = regexp_replace(t."imagen_url", '^.*/', '');
  UPDATE "sitio_sabrina_experiencias_experiencias" t SET "imagen_id" = m."id"
    FROM "medios" m WHERE m."filename" = regexp_replace(t."imagen_url", '^.*/', '');
  UPDATE "sitio_sabrina" t SET "sobre_mi_imagen_id" = m."id"
    FROM "medios" m WHERE m."filename" = regexp_replace(t."sobre_mi_imagen_url", '^.*/', '');
  UPDATE "sitio_sabrina" t SET "pack_imagen_id" = m."id"
    FROM "medios" m WHERE m."filename" = regexp_replace(t."pack_imagen_url", '^.*/', '');

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "sitio_sabrina_hero_escenas" WHERE "imagen_id" IS NULL)
      OR EXISTS (SELECT 1 FROM "sitio_sabrina_experiencias_experiencias" WHERE "imagen_id" IS NULL)
      OR EXISTS (SELECT 1 FROM "sitio_sabrina" WHERE "sobre_mi_imagen_id" IS NULL OR "pack_imagen_id" IS NULL)
    THEN
      RAISE EXCEPTION 'Hay imágenes del sitio sin un medio con el mismo nombre de archivo. Subir esos archivos a la colección medios antes de migrar.';
    END IF;
  END $$;

  ALTER TABLE "sitio_sabrina_hero_escenas" ALTER COLUMN "imagen_id" SET NOT NULL;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ALTER COLUMN "imagen_id" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "sobre_mi_imagen_id" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "pack_imagen_id" SET NOT NULL;

  ALTER TABLE "sitio_sabrina_hero_escenas" ADD CONSTRAINT "sitio_sabrina_hero_escenas_imagen_id_medios_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ADD CONSTRAINT "sitio_sabrina_experiencias_experiencias_imagen_id_medios_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sitio_sabrina" ADD CONSTRAINT "sitio_sabrina_sobre_mi_imagen_id_medios_id_fk" FOREIGN KEY ("sobre_mi_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sitio_sabrina" ADD CONSTRAINT "sitio_sabrina_pack_imagen_id_medios_id_fk" FOREIGN KEY ("pack_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;

  CREATE INDEX "sitio_sabrina_hero_escenas_imagen_idx" ON "sitio_sabrina_hero_escenas" USING btree ("imagen_id");
  CREATE INDEX "sitio_sabrina_experiencias_experiencias_imagen_idx" ON "sitio_sabrina_experiencias_experiencias" USING btree ("imagen_id");
  CREATE INDEX "sitio_sabrina_sobre_mi_sobre_mi_imagen_idx" ON "sitio_sabrina" USING btree ("sobre_mi_imagen_id");
  CREATE INDEX "sitio_sabrina_pack_pack_imagen_idx" ON "sitio_sabrina" USING btree ("pack_imagen_id");

  ALTER TABLE "sitio_sabrina_hero_escenas" DROP COLUMN "imagen_url";
  ALTER TABLE "sitio_sabrina_hero_escenas" DROP COLUMN "imagen_texto_alternativo";
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" DROP COLUMN "imagen_url";
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" DROP COLUMN "imagen_texto_alternativo";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "sobre_mi_imagen_url";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "sobre_mi_imagen_texto_alternativo";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "pack_imagen_url";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "pack_imagen_texto_alternativo";
  `)
}

/**
 * Vuelve a las columnas de texto. La url queda apuntando al archivo servido por el CMS
 * (/api/medios/file/<archivo>) y el texto alternativo se copia del medio.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "sitio_sabrina_hero_escenas" ADD COLUMN "imagen_url" varchar;
  ALTER TABLE "sitio_sabrina_hero_escenas" ADD COLUMN "imagen_texto_alternativo" varchar;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ADD COLUMN "imagen_url" varchar;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ADD COLUMN "imagen_texto_alternativo" varchar;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "sobre_mi_imagen_url" varchar;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "sobre_mi_imagen_texto_alternativo" varchar;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "pack_imagen_url" varchar;
  ALTER TABLE "sitio_sabrina" ADD COLUMN "pack_imagen_texto_alternativo" varchar;

  UPDATE "sitio_sabrina_hero_escenas" t
    SET "imagen_url" = '/api/medios/file/' || m."filename", "imagen_texto_alternativo" = m."texto_alternativo"
    FROM "medios" m WHERE m."id" = t."imagen_id";
  UPDATE "sitio_sabrina_experiencias_experiencias" t
    SET "imagen_url" = '/api/medios/file/' || m."filename", "imagen_texto_alternativo" = m."texto_alternativo"
    FROM "medios" m WHERE m."id" = t."imagen_id";
  UPDATE "sitio_sabrina" t
    SET "sobre_mi_imagen_url" = '/api/medios/file/' || m."filename", "sobre_mi_imagen_texto_alternativo" = m."texto_alternativo"
    FROM "medios" m WHERE m."id" = t."sobre_mi_imagen_id";
  UPDATE "sitio_sabrina" t
    SET "pack_imagen_url" = '/api/medios/file/' || m."filename", "pack_imagen_texto_alternativo" = m."texto_alternativo"
    FROM "medios" m WHERE m."id" = t."pack_imagen_id";

  ALTER TABLE "sitio_sabrina_hero_escenas" ALTER COLUMN "imagen_url" SET NOT NULL;
  ALTER TABLE "sitio_sabrina_hero_escenas" ALTER COLUMN "imagen_texto_alternativo" SET NOT NULL;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ALTER COLUMN "imagen_url" SET NOT NULL;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ALTER COLUMN "imagen_texto_alternativo" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "sobre_mi_imagen_url" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "sobre_mi_imagen_texto_alternativo" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "pack_imagen_url" SET NOT NULL;
  ALTER TABLE "sitio_sabrina" ALTER COLUMN "pack_imagen_texto_alternativo" SET NOT NULL;

  ALTER TABLE "sitio_sabrina_hero_escenas" DROP COLUMN "imagen_id";
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" DROP COLUMN "imagen_id";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "sobre_mi_imagen_id";
  ALTER TABLE "sitio_sabrina" DROP COLUMN "pack_imagen_id";
  `)
}
