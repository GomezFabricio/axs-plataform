-- ============================================================
-- esquema.sql — Plataforma Axs (PostgreSQL)
-- Modelo de referencia. Con Payload estas tablas se generan
-- desde la config; esto documenta la forma esperada.
-- Convenciones: snake_case en español, sin tildes ni ñ.
-- ============================================================


-- CLIENTAS (tenants)
create table clientas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  slug          text unique not null,
  dominio       text unique,
  theme         jsonb not null default '{}',     -- tokens de diseño de la clienta
  esta_activa   boolean not null default true,
  creada_en     timestamptz not null default now()
);


-- USUARIOS (logins): super_admin + tenant_editor
create table usuarios (
  id               uuid primary key default gen_random_uuid(),
  email            text unique not null,
  contrasena_hash  text not null,
  rol              text not null,                 -- 'super_admin' | 'tenant_editor'
  clienta_id       uuid references clientas(id) on delete cascade,  -- null para super_admin
  creado_en        timestamptz not null default now()
);


-- TIPOS_SECCION: biblioteca compartida (define los campos de cada tipo)
create table tipos_seccion (
  id          uuid primary key default gen_random_uuid(),
  clave       text unique not null,              -- 'sobre_mi', 'servicios', ...
  nombre      text not null,
  esquema     jsonb not null,                    -- define los campos editables (el contrato)
  creado_en   timestamptz not null default now()
);
-- Ejemplo de esquema para 'sobre_mi':
-- { "campos": [
--     { "clave": "titulo",      "tipo": "texto" },
--     { "clave": "copete",      "tipo": "texto" },
--     { "clave": "descripcion", "tipo": "texto_largo" },
--     { "clave": "imagen",      "tipo": "medio" }
-- ]}


-- SECCIONES: instancias por clienta (composicion + contenido)
create table secciones (
  id               uuid primary key default gen_random_uuid(),
  clienta_id       uuid not null references clientas(id) on delete cascade,
  tipo_seccion_id  uuid not null references tipos_seccion(id),
  orden            integer not null,
  datos            jsonb not null default '{}',  -- contenido segun el esquema del tipo
  esta_publicada   boolean not null default true,
  actualizada_en   timestamptz not null default now(),
  unique (clienta_id, orden)
);
-- Ejemplo de datos (instancia 'sobre_mi' de Sabrina):
-- { "titulo": "Hola, soy Sabrina",
--   "copete": "Creadora de comunidad",
--   "descripcion": "Empece creando contenido...",
--   "imagen": "medios/uuid" }


-- MEDIOS: archivos/fotos por clienta
create table medios (
  id                 uuid primary key default gen_random_uuid(),
  clienta_id         uuid not null references clientas(id) on delete cascade,
  url                text not null,
  tipo               text,                        -- image/png, image/jpeg...
  texto_alternativo  text,
  creado_en          timestamptz not null default now()
);


-- SUSCRIPCIONES: plan / mantenimiento mensual
create table suscripciones (
  id                 uuid primary key default gen_random_uuid(),
  clienta_id         uuid not null references clientas(id) on delete cascade,
  cuota_mensual      numeric(10,2),
  dia_de_cobro       integer,
  cambios_incluidos  integer not null default 1,  -- cambios estructurales por mes
  estado             text not null default 'activa',  -- activa | morosa | cancelada
  creada_en          timestamptz not null default now()
);


-- MANTENIMIENTOS: un registro por periodo, con el detalle de lo hecho
create table mantenimientos (
  id          uuid primary key default gen_random_uuid(),
  clienta_id  uuid not null references clientas(id) on delete cascade,
  periodo     text,                               -- '2026-06'
  fecha       date,
  detalle     text,                               -- que se hizo en este mantenimiento
  monto       numeric(10,2),
  estado      text not null default 'pendiente',  -- pendiente | pagado
  creado_en   timestamptz not null default now()
);


-- PAGOS: transferencia / qr / efectivo
create table pagos (
  id                uuid primary key default gen_random_uuid(),
  clienta_id        uuid not null references clientas(id) on delete cascade,
  mantenimiento_id  uuid references mantenimientos(id) on delete set null,
  monto             numeric(10,2) not null,
  metodo            text not null,                -- transferencia | qr | efectivo
  estado            text not null default 'pendiente',  -- pendiente | pagado
  pagado_en         timestamptz,
  confirmado_por    uuid references usuarios(id), -- quien lo marco pagado
  creado_en         timestamptz not null default now()
);


-- INDICES para consultas por clienta
create index idx_secciones_clienta      on secciones(clienta_id);
create index idx_medios_clienta         on medios(clienta_id);
create index idx_usuarios_clienta       on usuarios(clienta_id);
create index idx_mantenimientos_clienta on mantenimientos(clienta_id);
create index idx_pagos_clienta          on pagos(clienta_id);

-- Opcional (aislamiento fuerte): Row-Level Security por clienta_id,
-- para que a nivel base una clienta nunca pueda leer datos de otra.
