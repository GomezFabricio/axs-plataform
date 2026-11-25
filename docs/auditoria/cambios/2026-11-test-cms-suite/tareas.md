# Tareas — Tests del CMS

**Cambio:** `2026-11-test-cms-suite`

> Plan de implementación. Se ejecuta tarea por tarea; una casilla se tacha solo cuando se observó
> su resultado. Quien lo ejecute lee antes el `README.md` y `decisiones.md` de esta carpeta.

**Objetivo:** el CMS tiene una suite que prueba el aislamiento entre clientas, los medios, el
endpoint público y las migraciones, corre en CI y deja encendido el TDD.

**Arquitectura:** Vitest corre tests de integración contra Postgres. La corrida crea una base
plantilla migrada; cada archivo de test clona la suya (D2). Los tests usan la API local de
Payload con `overrideAccess: false` y, para lo que solo vive en REST, llaman a los handlers de
las rutas (D5).

**Tecnología:** Vitest, `pg`, Payload 3.85.1, Postgres 17.5, GitHub Actions.

**Diseño:** `README.md` y `decisiones.md` de esta carpeta.

## Restricciones globales

- pnpm, nunca npm. Versiones exactas, sin `^` ni `~`. Cada dependencia nueva se revisa antes de
  sumarla y se corre `pnpm audit`.
- Node 26 o superior, pnpm 10.33.0.
- Identificadores en español: `camelCase` para funciones y variables, `PascalCase` para tipos.
- Ningún archivo de test nombra `super_admin` ni `tenant_editor` (D6).
- Los tests no escriben en `apps/cms/media` ni en la base de desarrollo `axs_cms`.
- No se lee ningún archivo `.env`. La configuración de test tiene valores por defecto en el
  código y se puede pisar con variables de entorno.
- No se cambia el comportamiento del CMS, salvo D3 y D4. Si un test destapa un defecto, se
  anota en `decisiones.md`, el test queda marcado con `it.fails` y se sigue.
- Commits convencionales en español, sin firmas ni co-autoría.

## Foco de revisión

Casos que el diseño implica y que ningún punto del alcance nombra. Cada uno tiene su test en la
tarea indicada.

1. Una editora sin clienta asignada no ve ni modifica nada (T3).
2. Una editora intenta cambiarse de clienta o reasignar un medio a otra clienta: el valor no
   cambia (T3).
3. Un archivo con extensión `.png` y contenido SVG no entra como imagen (T4).
4. El contenido del sitio todavía está vacío: el endpoint responde sin filtrar detalle interno
   (T6).
5. Llega una petición sin `x-forwarded-for`: el límite se aplica igual, sobre una clave común
   (T6).

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `apps/cms/vitest.config.ts` | Configuración del runner y alias `@/` y `@payload-config`. |
| `apps/cms/tests/soporte/entorno.ts` | Valores de entorno de test y sus valores por defecto. |
| `apps/cms/tests/soporte/preparacionGlobal.ts` | Crea y migra la base plantilla; la borra al terminar. |
| `apps/cms/tests/soporte/preparacionArchivo.ts` | Clona la plantilla para el archivo, crea la carpeta temporal de medios y limpia. |
| `apps/cms/tests/soporte/fabricas.ts` | Crea clientas, usuarios y medios de prueba. Único lugar con nombres de rol. |
| `apps/cms/tests/soporte/http.ts` | `pedir()`: llama a los handlers como si fuera HTTP. |
| `apps/cms/tests/integracion/*.test.ts` | Un archivo por tema. |
| `apps/cms/tests/unitarios/rateLimit.test.ts` | Tests de la función pura. |
| `.github/workflows/ci.yml` | Typecheck, lint, tests, build del CMS, audit. |

---

### Task 1: Arnés de tests

**Archivos:**
- Crear: `apps/cms/vitest.config.ts`, `apps/cms/tests/soporte/entorno.ts`,
  `preparacionGlobal.ts`, `preparacionArchivo.ts`, `fabricas.ts`, `http.ts`,
  `apps/cms/tests/integracion/arnes.test.ts`
- Modificar: `apps/cms/package.json`, `package.json` (raíz), `apps/cms/payload.config.ts` (D3),
  `apps/cms/src/collections/Medios.ts` (D4), `.dockerignore`

**Produce** (lo usan todas las tareas siguientes):

> Nota (2026-11-25): `BASE_PLANTILLA` no se implementó así. El nombre de la plantilla y el de
> cada base llevan un prefijo al azar por corrida, que viaja con `provide` e `inject` (D21).

```ts
// tests/soporte/entorno.ts
export const URL_POSTGRES_TEST: string; // process.env.TEST_POSTGRES_URL ?? "postgres://axs:axsdev@localhost:5432"
export const BASE_PLANTILLA: string;    // "axs_test_plantilla_<pid>"

// tests/soporte/fabricas.ts
import type { Payload } from "payload";
import type { Clienta, Medio, Usuario } from "@/payload-types";
export type UsuarioDeTest = Usuario & { clave: string };
export async function obtenerPayloadDeTest(): Promise<Payload>;
export async function crearClienta(datos?: { nombre?: string; slug?: string }): Promise<Clienta>;
/** Usuario del panel limitado a esa clienta. Sin argumento: sin clienta asignada. */
export async function crearEditora(clienta?: Clienta): Promise<UsuarioDeTest>;
/** Usuario de Axs con acceso total. */
export async function crearAdministradorAxs(): Promise<UsuarioDeTest>;
export async function subirMedio(clienta: Clienta, textoAlternativo?: string): Promise<Medio>;
export function imagenDePrueba(opciones?: {
  tipo?: "png" | "jpeg" | "webp" | "avif" | "gif" | "svg";
  bytes?: number;   // rellena hasta ese tamaño
  nombre?: string;
}): { nombre: string; tipo: string; contenido: Buffer };

// tests/soporte/http.ts
export async function pedir(
  metodo: "GET" | "POST" | "PATCH" | "DELETE",
  ruta: string,                      // "/api/medios", "/api/sitios/sabrina"
  opciones?: {
    como?: UsuarioDeTest;            // inicia sesión y manda el token
    json?: unknown;
    archivo?: { nombre: string; tipo: string; contenido: Buffer };
    campos?: Record<string, unknown>; // se mandan en "_payload" junto al archivo
    cabeceras?: Record<string, string>;
  },
): Promise<Response>;
```

- [x] **Paso 1.** Commitear en `feat/cms-docker-e-imagenes` los documentos pendientes
  (`docs/modelo-de-negocio.md`, `CLAUDE.md`, `docs/arquitectura/overview.md`, README del Docker
  y esta carpeta) con `docs: perfiles y permisos, parametrización y expediente de tests`. Crear
  la rama `feat/cms-tests` desde ahí.
- [x] **Paso 2.** Consultar la versión estable de Vitest (`pnpm view vitest version`), revisar
  su changelog y su soporte de Node 26, e instalarla exacta como dependencia de desarrollo de
  `@axs/cms`. Instalar `pg` y `@types/pg` en `8.20.0`, que es la versión que ya resuelve el
  lockfile. Correr `pnpm audit`.
- [x] **Paso 3.** `vitest.config.ts`: entorno `node`, `include: ["tests/**/*.test.ts"]`,
  `globalSetup: "tests/soporte/preparacionGlobal.ts"`,
  `setupFiles: ["tests/soporte/preparacionArchivo.ts"]`, `pool: "forks"`, tiempo máximo de 30 s
  por test y por hook, alias `@` a `./src` y `@payload-config` a `./payload.config.ts`.
  Scripts: `"test": "vitest run"` y `"test:watch": "vitest"` en `apps/cms`; `"test": "pnpm -r
  test"` en la raíz.
- [x] **Paso 4.** D3 en `payload.config.ts`: `push` queda encendido solo si `NODE_ENV` no es
  `"production"` ni `"test"`.
- [x] **Paso 5.** D4 en `Medios.ts`: `staticDir: process.env["MEDIA_DIR"] ?? "media"`.
- [x] **Paso 6.** `preparacionGlobal.ts`: con `pg`, conectado a la base `postgres` de
  `URL_POSTGRES_TEST`, borra y crea `BASE_PLANTILLA`. Fija `DATABASE_URI` a esa base,
  `PAYLOAD_SECRET` a un valor fijo de test y `NODE_ENV` a `"test"`, obtiene Payload, corre
  `payload.db.migrate({ migrations })` con el arreglo de `src/migrations/index.ts` y cierra la
  conexión con `payload.db.destroy()`. Su función de cierre borra la plantilla. Si Postgres no
  responde, falla con el mensaje: `No hay Postgres en <url>. Levantalo con: docker compose -f
  apps/cms/docker-compose.yml up -d`.
- [x] **Paso 7.** `preparacionArchivo.ts`: antes de cargar el archivo de test crea
  `axs_test_<pid>_<n>` con `TEMPLATE BASE_PLANTILLA`, fija `DATABASE_URI` a esa base y
  `MEDIA_DIR` a una carpeta de `mkdtemp` en el directorio temporal del sistema. En `afterAll`
  cierra Payload, borra la base y la carpeta.
- [x] **Paso 8.** `fabricas.ts` y `http.ts` según las firmas de arriba. Las fábricas crean con
  `overrideAccess: true` y generan correos y slugs únicos. `imagenDePrueba` genera la imagen con
  `sharp` y rellena con ceros hasta `bytes`; para `svg` devuelve un SVG mínimo. `pedir` despacha
  `/api/sitios/sabrina` al handler de esa ruta y el resto de `/api/*` al handler de
  `[...slug]`, con `params` como promesa del arreglo de segmentos; con `como`, hace
  `payload.login` y manda `Authorization: JWT <token>`.
- [x] **Paso 9.** `arnes.test.ts`, que comprueba los supuestos del diseño:

```ts
it("la base del archivo se armó con las migraciones", async () => {
  const payload = await obtenerPayloadDeTest();
  const { docs } = await payload.find({ collection: "payload-migrations", limit: 10 });
  expect(docs.map((d) => d.name)).toEqual(
    expect.arrayContaining(["20260624_000000_baseline", "20261123_000000_imagenes_upload"]),
  );
});
it("la API local crea y lee una clienta", async () => {
  const clienta = await crearClienta({ slug: "prueba-arnes" });
  expect(clienta.slug).toBe("prueba-arnes");
});
it("los handlers responden sin servidor", async () => {
  const respuesta = await pedir("GET", "/api/clientas");
  expect(respuesta.status).toBe(403);
});
it("los medios de test no van a la carpeta del repo", async () => {
  const clienta = await crearClienta();
  const medio = await subirMedio(clienta);
  expect(existsSync(path.join(process.env.MEDIA_DIR!, medio.filename!))).toBe(true);
  expect(existsSync(path.join("media", medio.filename!))).toBe(false);
});
```

- [x] **Paso 10.** Correr `pnpm --filter @axs/cms test`. Esperado: 4 tests pasan. Correrlo dos
  veces seguidas y comprobar que no queda ninguna base `axs_test_*` (en esta máquina no hay
  `psql`: usar `docker exec cms-postgres-1 psql -U axs -d postgres -Atc "select datname from
  pg_database"`).
- [x] **Paso 11.** Si Vitest no corre en Node 26, si `getPayload` no arranca bajo Vitest, si
  `migrate({ migrations })` no arma la base o si los handlers no responden: **frenar**, anotar
  en `decisiones.md` qué falló con el error textual y consultar antes de seguir.
- [x] **Paso 12.** `pnpm typecheck` y `pnpm lint` en verde. Agregar `apps/cms/tests` al
  `.dockerignore`. Commit: `test(cms): arnés de tests de integración con Vitest y Postgres`.

**Hecho.** Commits `ae1085f`, `4ef4954` y `e27b5a0`. 4 tests. Revisión aprobada. El cierre global limpia las bases y carpetas de la corrida aunque un archivo de test no cargue.

### Task 2: Límite de peticiones (unitario)

**Archivos:** crear `apps/cms/tests/unitarios/rateLimit.test.ts`. Cada test usa una clave
propia, porque el estado es global al proceso.

- [x] **Paso 1.** Escribir los tests:

```ts
it("permite 60 peticiones en la ventana y rechaza la 61", () => {
  for (let i = 1; i <= 60; i++) {
    expect(consultarRateLimit("ip-a", 1_000)).toMatchObject({ permitido: true, restantes: 60 - i });
  }
  expect(consultarRateLimit("ip-a", 1_000)).toEqual({ permitido: false, restantes: 0, reiniciaEn: 61_000 });
});
it("abre una ventana nueva a los 60 segundos", () => {
  for (let i = 0; i < 61; i++) consultarRateLimit("ip-b", 1_000);
  expect(consultarRateLimit("ip-b", 60_999).permitido).toBe(false);
  expect(consultarRateLimit("ip-b", 61_000)).toMatchObject({ permitido: true, restantes: 59 });
});
it("cuenta cada clave por separado", () => {
  for (let i = 0; i < 60; i++) consultarRateLimit("ip-c", 1_000);
  expect(consultarRateLimit("ip-d", 1_000).permitido).toBe(true);
});
```

- [x] **Paso 2.** Correr y ver que pasan. Validación (D7): cambiar `LIMITE` a 61, ver fallar el
  primer test, revertir.
- [x] **Paso 3.** Commit: `test(cms): límite de peticiones`.

**Hecho.** Commits `898554e`. Revisión aprobada.

### Task 3: Aislamiento entre clientas

**Archivos:** crear `apps/cms/tests/integracion/aislamiento.test.ts`.
**Usa:** todas las fábricas de T1. Las operaciones van por la API local con
`overrideAccess: false` y `user`.

Preparación del archivo: dos clientas (`a`, `b`), una editora de cada una, una administradora
de Axs, un medio de cada clienta y una editora sin clienta.

- [x] **Paso 1.** Escribir los tests. Cada línea es un `it`:

| Quién | Operación | Esperado |
|---|---|---|
| Editora de A | listar clientas | solo A |
| Editora de A | leer la clienta B por id | error `NotFound` |
| Editora de A | crear, editar o borrar una clienta | error `Forbidden` |
| Editora de A | listar usuarios | solo usuarios de A |
| Editora de A | leer o editar a la editora de B | error `NotFound` |
| Editora de A | borrar un usuario | error `Forbidden` |
| Editora de A | listar medios | solo medios de A |
| Editora de A | leer, editar o borrar el medio de B | error `NotFound`; el medio de B sigue existiendo |
| Editora de A | subir un medio sin indicar clienta | queda asignado a A |
| Editora de A | subir un medio indicando la clienta B | queda asignado a A |
| Editora de A | editar su medio poniéndole la clienta B | sigue asignado a A (foco 2) |
| Editora de A | editarse a sí misma poniéndose la clienta B | sigue en A (foco 2) |
| Editora de A | editarse a sí misma subiéndose el rol | conserva su acceso limitado: sigue sin ver B |
| Editora sin clienta | listar clientas, usuarios y medios | error `Forbidden` en los tres (foco 1) |
| Administradora de Axs | listar clientas y medios | ve A y B |
| Sin sesión | listar clientas o usuarios | error `Forbidden` |
| Sin sesión | listar medios | los ve, y ningún documento trae el campo `clienta` |

El test de "subirse el rol" no nombra roles: la fábrica expone
`intentarVolverseAdministradora(usuaria)` y el test comprueba el efecto.

- [x] **Paso 2.** Tests del contenido del sitio (global `sitio-sabrina`). Preparación: una
  clienta con slug `sabrina` y su editora.

| Quién | Operación | Esperado |
|---|---|---|
| Editora de la clienta `sabrina` | leer y editar el contenido | puede |
| Editora de otra clienta | leer o editar el contenido | error `Forbidden` |
| Sin sesión | leer el contenido por la API local con `overrideAccess: false` | error `Forbidden` |
| Editora de la clienta `sabrina` | poner en una sección una foto de otra clienta | error de validación |

- [x] **Paso 3.** Correr y ver que pasan. Validación (D7): en `access/porTenant.ts`, hacer que
  la rama de la editora devuelva `true`; tienen que fallar los tests de listar y leer de otra
  clienta. Revertir.
- [x] **Paso 4.** Commit: `test(cms): aislamiento entre clientas`.

**Hecho.** Commits `5b68547` y `549374c`. 33 tests. Revisión aprobada tras una ronda de arreglos: datos propios por test y validación regla por regla (D14).

### Task 4: Medios por HTTP

**Archivos:** crear `apps/cms/tests/integracion/medios.test.ts`. **Usa:** `pedir`,
`imagenDePrueba`, fábricas.

- [x] **Paso 1.** Escribir los tests. Las subidas son `pedir("POST", "/api/medios", { como,
  archivo, campos: { textoAlternativo: "Foto de prueba" } })`.

| Caso | Esperado |
|---|---|
| Subir PNG, JPEG, WebP y AVIF (un test por formato) | 201 y el archivo existe en `MEDIA_DIR` |
| Subir GIF | 400, no se crea documento ni archivo |
| Subir SVG | 400, no se crea documento ni archivo |
| Subir un SVG con nombre `foto.png` y tipo `image/png` (foco 3) | no es 201, no se crea documento |
| Subir un PNG de 10.000.001 bytes | no es 201, no se crea documento ni queda archivo |
| Subir un PNG de 9.999.000 bytes | 201 |
| Subir sin sesión | 403 |
| Pedir `/api/medios/file/<archivo>` sin sesión | 200 y `content-type` de imagen |
| Borrar una foto que está en uso en el contenido del sitio | 400 con el mensaje `Esta foto está en uso en el sitio. Primero hay que reemplazarla en el contenido.`; el documento y el archivo siguen existiendo |
| Borrar una foto que no está en uso | 200; el documento y el archivo ya no existen |

  El caso "en uso" necesita el contenido del sitio cargado: usar `seedSabrina(payload)` de
  `src/seed/sabrina.ts` en la preparación del archivo.

- [x] **Paso 2.** Correr y ver que pasan. Validación (D7): quitar `image/webp` de
  `TIPOS_IMAGEN_PERMITIDOS`, ver fallar el test de WebP, revertir. Quitar el hook
  `beforeDelete`, ver fallar el test de "en uso", revertir.
- [x] **Paso 3.** Commit: `test(cms): subida y borrado de medios`.

**Hecho.** Commits `27cc7dc` y `d8bcebd`. 13 tests. Revisión aprobada tras una ronda de arreglos. El PNG de 10.000.001 bytes responde 413 (D17).

### Task 5: Alta de usuarios por HTTP

**Archivos:** crear `apps/cms/tests/integracion/usuarios.test.ts`.

- [x] **Paso 1.** Escribir los tests:

| Caso | Esperado |
|---|---|
| `POST /api/usuarios` sin sesión | 403 y no se crea el usuario |
| `POST /api/usuarios` como editora | 403 y no se crea el usuario |
| `POST /api/usuarios` como administradora de Axs | 201 |
| Iniciar sesión con la clave correcta | 200 y devuelve token |
| Iniciar sesión con clave incorrecta | 401 |
| `GET /api/usuarios/me` con el token de una editora | devuelve su usuario y su clienta |
| `POST /api/usuarios/first-register` cuando ya hay usuarios | 403 |

- [x] **Paso 2.** Correr y ver que pasan. Validación (D7): quitar el hook `beforeChange` de
  `Usuarios.ts`, ver fallar el primer test, revertir.
- [x] **Paso 3.** Commit: `test(cms): alta de usuarios e inicio de sesión`.

**Hecho.** Commits `b6f888b` y `09026a5`. 12 tests. Revisión aprobada. Se sumó un test por cada defensa del alta (D18).

### Task 6: Endpoint público y carga inicial

**Archivos:** crear `apps/cms/tests/integracion/endpoint-sitio.test.ts` y
`apps/cms/tests/integracion/carga-inicial.test.ts`.

- [x] **Paso 1.** `carga-inicial.test.ts`:

```ts
it("carga el contenido de Sabrina y repetirla no duplica nada", async () => {
  const payload = await obtenerPayloadDeTest();
  await seedSabrina(payload);
  const antes = await contar(payload);   // { clientas, medios }
  await seedSabrina(payload);
  expect(await contar(payload)).toEqual(antes);
  expect(antes.clientas).toBe(1);
});
```

- [x] **Paso 2.** `endpoint-sitio.test.ts`, con el contenido cargado por `seedSabrina`. Cada
  test manda una IP propia en `x-forwarded-for`.

| Caso | Esperado |
|---|---|
| `GET /api/sitios/sabrina` | 200 y `SitioSabrinaSchema.parse(cuerpo)` no lanza |
| El cuerpo comparado con el fixture `sitioSabrina` de `@axs/cms-client/fixtures`, quitando de ambos las claves `url`, `ancho` y `alto` de cada imagen | iguales |
| Cada imagen del cuerpo | `url` termina con el nombre de archivo del fixture, `textoAlternativo` igual al del fixture, `ancho` y `alto` son números positivos |
| 60 peticiones desde la misma IP | todas 200; la última trae `X-RateLimit-Remaining: 0` |
| La petición 61 desde esa IP | 429, cuerpo `{ error: "Demasiadas solicitudes" }`, cabecera `Retry-After` entre 1 y 60 |
| Una petición desde otra IP después de eso | 200 |
| Dos peticiones sin `x-forwarded-for` ni `x-real-ip` (foco 5) | comparten cuenta: la segunda trae un `X-RateLimit-Remaining` una unidad menor |
| `x-forwarded-for: 1.1.1.1, 2.2.2.2` | cuenta sobre `1.1.1.1` |

- [x] **Paso 3.** En un `describe` aparte, sin `seedSabrina` (foco 4): `GET /api/sitios/sabrina`
  con el contenido vacío responde 200 o 500; si es 500, el cuerpo es exactamente
  `{ error: "No se pudo obtener el sitio" }`. En ningún caso el cuerpo contiene `stack`, una
  ruta de archivo ni texto de SQL. Anotar en `decisiones.md` cuál de los dos devuelve hoy.
- [x] **Paso 4.** Correr y ver que pasan. Validación (D7): en `route.ts`, cambiar
  `titulo: contacto?.titulo` por una cadena fija y ver fallar la comparación con el fixture.
  Revertir.
- [x] **Paso 5.** Commit: `test(cms): endpoint público del sitio y carga inicial`.

**Hecho.** Commit `27958f1`. 9 tests. Revisión aprobada. El contenido vacío responde 422 (D19).

### Task 7: CI, TDD encendido y cierre

**Archivos:** crear `.github/workflows/ci.yml`; modificar `docs/auditoria/config.yaml`,
`docs/arquitectura/overview.md`, `README.md` de esta carpeta, `CLAUDE.md`.

- [x] **Paso 1.** `ci.yml`: se dispara en `pull_request` y en `push` a `develop` y `main`. Un
  job en `ubuntu-latest` con el servicio `postgres:17.5` (usuario `axs`, clave `axsdev`, base
  `axs_cms`, puerto 5432, chequeo de salud con `pg_isready`). Pasos: checkout, pnpm 10.33.0,
  Node 26 con caché de pnpm, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`,
  `pnpm test`, `pnpm --filter @axs/cms build` con `DATABASE_URI` apuntando al servicio y un
  `PAYLOAD_SECRET` de relleno, `pnpm audit`. Las acciones van fijadas por hash de commit.
- [x] **Paso 2.** Correr en local, en ese orden, los mismos comandos del workflow. Esperado:
  todos en verde. Si `pnpm audit` o el build fallan por algo que ya estaba así en `develop`,
  anotarlo en `decisiones.md` y consultar; no se silencia ni se arregla dentro de esta tarea.
- [x] **Paso 3.** `config.yaml`: `test_runner.name: vitest`, `test_runner.command: pnpm test`,
  `test_runner.detected_from: apps/cms/package.json`, `rules.implement.tdd: true`.
- [x] **Paso 4.** `CLAUDE.md`: sección corta "Tests" con cómo correrlos (`pnpm test`, que
  necesita el Postgres local levantado) y la regla D6. Corregir la línea de CI de la sección
  Git para que diga lo que el workflow hace de verdad.
- [x] **Paso 5.** `overview.md`: proyecto 1 pasa a "Completado" con fecha y enlace a este
  expediente. `README.md`: estado "cerrado" y sección `## Cierre` con lo verificado (cantidad de
  tests, tiempo de la corrida) y lo diferido (D8, tests del panel en el navegador, lo que haya
  quedado con `it.fails`).
- [x] **Paso 6.** Commit: `ci: workflow de typecheck, lint, tests y audit; TDD encendido`.
- [x] **Paso 7.** El primer resultado real del workflow se ve recién al subir la rama. Subirla
  y abrir el PR es decisión de Fabricio. Hecho el 2026-11-25: PR #1 y PR #2 abiertos; la primera
  corrida destapó una diferencia entre macOS y Linux (D24) y la segunda quedó en verde.

**Hecho.** Commits `1e9f066` y `e9c5d68`. Revisión aprobada. En local: instalación,
typecheck, lint, tests y build del CMS en verde; la auditoría falla por las vulnerabilidades
previas (D13) y corre en un job que informa sin bloquear. El paso 5 se hizo al cerrar el
expediente.

---

## Revisión final de la rama

- [x] Revisión de la rama completa (`4c87e1a..3b87b1b`): "con arreglos". Sin defectos del CMS;
  16 reglas rotas a propósito sin que la suite lo notara (D22).
- [x] Tanda única de arreglos: commits `aaeedd2`, `d766a12`, `c35c50a`, `66eba58` y `d072c29`.
  La suite pasó de 74 a 97 tests.
- [x] Verificación de la tanda.
- [x] Cierre del expediente, `overview.md`, ADR-004 y `CLAUDE.md`.
