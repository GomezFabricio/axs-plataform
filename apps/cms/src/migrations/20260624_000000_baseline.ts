import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_sitio_sabrina_pilares_pilares_variante" AS ENUM('grande', 'compacto', 'banda');
  CREATE TYPE "public"."enum_usuarios_rol" AS ENUM('super_admin', 'tenant_editor');
  CREATE TABLE "medios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto_alternativo" varchar NOT NULL,
  	"clienta_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  CREATE TABLE "clientas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"dominio" varchar,
  	"theme" jsonb,
  	"esta_activa" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clientas_id" integer,
  	"usuarios_id" integer,
  	"medios_id" integer
  );
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "usuarios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"rol" "enum_usuarios_rol" DEFAULT 'tenant_editor' NOT NULL,
  	"clienta_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT '0',
  	"lock_until" timestamp(3) with time zone
  );
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "sitio_sabrina_sobre_mi_parrafos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL
  );
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"usuarios_id" integer
  );
  CREATE TABLE "sitio_sabrina_hero_escenas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"titulo" varchar NOT NULL,
  	"copete" varchar NOT NULL,
  	"imagen_url" varchar NOT NULL,
  	"imagen_texto_alternativo" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_pilares_pilares" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icono" varchar NOT NULL,
  	"titulo" varchar NOT NULL,
  	"descripcion" varchar NOT NULL,
  	"nota" varchar,
  	"variante" "enum_sitio_sabrina_pilares_pilares_variante" DEFAULT 'compacto' NOT NULL
  );
  CREATE TABLE "sitio_sabrina_experiencias_experiencias" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"descripcion" varchar NOT NULL,
  	"imagen_url" varchar NOT NULL,
  	"imagen_texto_alternativo" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_experiencias_tambien_organizo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icono" varchar NOT NULL,
  	"texto" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_testimonios_testimonios" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cita" varchar NOT NULL,
  	"nombre" varchar NOT NULL,
  	"rol" varchar NOT NULL,
  	"destacado" boolean DEFAULT false
  );
  CREATE TABLE "sitio_sabrina_marcas_marcas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pregunta" varchar NOT NULL,
  	"respuesta" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_redes_redes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icono" varchar NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_pack_incluye" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  CREATE TABLE "sitio_sabrina_como_trabajo_pasos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"numero" varchar NOT NULL,
  	"titulo" varchar NOT NULL,
  	"descripcion" varchar NOT NULL
  );
  CREATE TABLE "usuarios_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  CREATE TABLE "sitio_sabrina" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"config_nombre" varchar NOT NULL,
  	"config_acento" varchar NOT NULL,
  	"config_acento_suave" varchar NOT NULL,
  	"config_whatsapp" varchar NOT NULL,
  	"config_instagram" varchar,
  	"config_tiktok" varchar,
  	"hero_cta_primario" varchar NOT NULL,
  	"hero_cta_secundario" varchar NOT NULL,
  	"sobre_mi_copete" varchar NOT NULL,
  	"sobre_mi_titulo" varchar NOT NULL,
  	"sobre_mi_imagen_url" varchar NOT NULL,
  	"sobre_mi_imagen_texto_alternativo" varchar NOT NULL,
  	"proposito_icono" varchar NOT NULL,
  	"proposito_texto" varchar NOT NULL,
  	"pilares_titulo" varchar NOT NULL,
  	"pilares_copete" varchar NOT NULL,
  	"pack_etiqueta" varchar NOT NULL,
  	"pack_titulo" varchar NOT NULL,
  	"pack_descripcion" varchar NOT NULL,
  	"pack_cita" varchar NOT NULL,
  	"pack_imagen_url" varchar NOT NULL,
  	"pack_imagen_texto_alternativo" varchar NOT NULL,
  	"como_trabajo_copete" varchar NOT NULL,
  	"como_trabajo_titulo" varchar NOT NULL,
  	"experiencias_titulo" varchar NOT NULL,
  	"experiencias_copete" varchar NOT NULL,
  	"testimonios_titulo" varchar NOT NULL,
  	"marcas_copete" varchar NOT NULL,
  	"faq_titulo" varchar NOT NULL,
  	"contacto_titulo" varchar NOT NULL,
  	"contacto_descripcion" varchar NOT NULL,
  	"redes_nombre" varchar NOT NULL,
  	"redes_descripcion" varchar NOT NULL,
  	"redes_ubicacion" varchar NOT NULL,
  	"redes_nota" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  ALTER TABLE "medios" ADD CONSTRAINT "medios_clienta_id_clientas_id_fk" FOREIGN KEY ("clienta_id") REFERENCES "public"."clientas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clientas_fk" FOREIGN KEY ("clientas_id") REFERENCES "public"."clientas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_medios_fk" FOREIGN KEY ("medios_id") REFERENCES "public"."medios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_clienta_id_clientas_id_fk" FOREIGN KEY ("clienta_id") REFERENCES "public"."clientas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_sobre_mi_parrafos" ADD CONSTRAINT "sitio_sabrina_sobre_mi_parrafos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_hero_escenas" ADD CONSTRAINT "sitio_sabrina_hero_escenas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_pilares_pilares" ADD CONSTRAINT "sitio_sabrina_pilares_pilares_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_experiencias_experiencias" ADD CONSTRAINT "sitio_sabrina_experiencias_experiencias_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_experiencias_tambien_organizo" ADD CONSTRAINT "sitio_sabrina_experiencias_tambien_organizo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_testimonios_testimonios" ADD CONSTRAINT "sitio_sabrina_testimonios_testimonios_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_marcas_marcas" ADD CONSTRAINT "sitio_sabrina_marcas_marcas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_faq_items" ADD CONSTRAINT "sitio_sabrina_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_redes_redes" ADD CONSTRAINT "sitio_sabrina_redes_redes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_pack_incluye" ADD CONSTRAINT "sitio_sabrina_pack_incluye_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sitio_sabrina_como_trabajo_pasos" ADD CONSTRAINT "sitio_sabrina_como_trabajo_pasos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sitio_sabrina"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usuarios_sessions" ADD CONSTRAINT "usuarios_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "medios_clienta_idx" ON "medios" USING btree ("clienta_id" int4_ops);
  CREATE INDEX "medios_created_at_idx" ON "medios" USING btree ("created_at" timestamptz_ops);
  CREATE UNIQUE INDEX "medios_filename_idx" ON "medios" USING btree ("filename" text_ops);
  CREATE INDEX "medios_updated_at_idx" ON "medios" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "clientas_created_at_idx" ON "clientas" USING btree ("created_at" timestamptz_ops);
  CREATE UNIQUE INDEX "clientas_slug_idx" ON "clientas" USING btree ("slug" text_ops);
  CREATE INDEX "clientas_updated_at_idx" ON "clientas" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at" timestamptz_ops);
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug" text_ops);
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "payload_locked_documents_rels_clientas_id_idx" ON "payload_locked_documents_rels" USING btree ("clientas_id" int4_ops);
  CREATE INDEX "payload_locked_documents_rels_medios_id_idx" ON "payload_locked_documents_rels" USING btree ("medios_id" int4_ops);
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order" int4_ops);
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id" int4_ops);
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path" text_ops);
  CREATE INDEX "payload_locked_documents_rels_usuarios_id_idx" ON "payload_locked_documents_rels" USING btree ("usuarios_id" int4_ops);
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key" text_ops);
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at" timestamptz_ops);
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key" text_ops);
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "usuarios_clienta_idx" ON "usuarios" USING btree ("clienta_id" int4_ops);
  CREATE INDEX "usuarios_created_at_idx" ON "usuarios" USING btree ("created_at" timestamptz_ops);
  CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email" text_ops);
  CREATE INDEX "usuarios_updated_at_idx" ON "usuarios" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at" timestamptz_ops);
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at" timestamptz_ops);
  CREATE INDEX "sitio_sabrina_sobre_mi_parrafos_order_idx" ON "sitio_sabrina_sobre_mi_parrafos" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_sobre_mi_parrafos_parent_id_idx" ON "sitio_sabrina_sobre_mi_parrafos" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order" int4_ops);
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id" int4_ops);
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path" text_ops);
  CREATE INDEX "payload_preferences_rels_usuarios_id_idx" ON "payload_preferences_rels" USING btree ("usuarios_id" int4_ops);
  CREATE INDEX "sitio_sabrina_hero_escenas_order_idx" ON "sitio_sabrina_hero_escenas" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_hero_escenas_parent_id_idx" ON "sitio_sabrina_hero_escenas" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_pilares_pilares_order_idx" ON "sitio_sabrina_pilares_pilares" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_pilares_pilares_parent_id_idx" ON "sitio_sabrina_pilares_pilares" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_experiencias_experiencias_order_idx" ON "sitio_sabrina_experiencias_experiencias" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_experiencias_experiencias_parent_id_idx" ON "sitio_sabrina_experiencias_experiencias" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_experiencias_tambien_organizo_order_idx" ON "sitio_sabrina_experiencias_tambien_organizo" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_experiencias_tambien_organizo_parent_id_idx" ON "sitio_sabrina_experiencias_tambien_organizo" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_testimonios_testimonios_order_idx" ON "sitio_sabrina_testimonios_testimonios" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_testimonios_testimonios_parent_id_idx" ON "sitio_sabrina_testimonios_testimonios" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_marcas_marcas_order_idx" ON "sitio_sabrina_marcas_marcas" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_marcas_marcas_parent_id_idx" ON "sitio_sabrina_marcas_marcas" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_faq_items_order_idx" ON "sitio_sabrina_faq_items" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_faq_items_parent_id_idx" ON "sitio_sabrina_faq_items" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_redes_redes_order_idx" ON "sitio_sabrina_redes_redes" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_redes_redes_parent_id_idx" ON "sitio_sabrina_redes_redes" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_pack_incluye_order_idx" ON "sitio_sabrina_pack_incluye" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_pack_incluye_parent_id_idx" ON "sitio_sabrina_pack_incluye" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "sitio_sabrina_como_trabajo_pasos_order_idx" ON "sitio_sabrina_como_trabajo_pasos" USING btree ("_order" int4_ops);
  CREATE INDEX "sitio_sabrina_como_trabajo_pasos_parent_id_idx" ON "sitio_sabrina_como_trabajo_pasos" USING btree ("_parent_id" int4_ops);
  CREATE INDEX "usuarios_sessions_order_idx" ON "usuarios_sessions" USING btree ("_order" int4_ops);
  CREATE INDEX "usuarios_sessions_parent_id_idx" ON "usuarios_sessions" USING btree ("_parent_id" int4_ops);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
}
