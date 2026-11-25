# Decisiones — Tests del CMS

**Cambio:** `2026-11-test-cms-suite`

Registro append-only. Cada entrada: fecha, qué se decidió y por qué.

---

## D1 — Vitest con tests de integración contra un Postgres real (2026-11-25)

Los tests usan la API local de Payload y los handlers reales contra una base Postgres. Se
descartaron los unitarios con simulaciones: una simulación del control de acceso no demuestra
que el control de acceso funcione. Detalle de los enfoques en el README.

## D2 — Una base descartable por archivo de test, clonada de una plantilla (2026-11-25)

Al empezar la corrida se crea una base plantilla y se le corren las migraciones una sola vez.
Cada archivo de test clona la plantilla (`CREATE DATABASE ... TEMPLATE ...`), trabaja sobre su
copia y la borra al terminar.

**Por qué:** el contenido del sitio es un global único, así que dos archivos que lo modifiquen
se pisarían si compartieran base. Con una base por archivo los tests pueden correr en paralelo y
ninguno depende del orden. Clonar una plantilla en Postgres tarda milisegundos; migrar una base
por archivo tardaría segundos.

## D3 — En test el esquema sale de las migraciones, no de `push` (2026-11-25)

`payload.config.ts` pasa de `push: NODE_ENV !== "production"` a apagar `push` también cuando
`NODE_ENV === "test"`. La plantilla se arma con `payload.db.migrate({ migrations })`, usando el
arreglo de `src/migrations/index.ts`.

**Por qué:** con `push` encendido el esquema lo generaría Payload a partir de la configuración y
las migraciones no se probarían nunca. Así, una migración rota o faltante rompe la suite. En
desarrollo y producción no cambia nada.

## D4 — La carpeta de medios se configura con `MEDIA_DIR` (2026-11-25)

`Medios.ts` pasa de `staticDir: "media"` a `staticDir: process.env["MEDIA_DIR"] ?? "media"`.
Los tests apuntan `MEDIA_DIR` a una carpeta temporal fuera del repo.

**Por qué:** sin esto, cada test que sube una foto la dejaría en `apps/cms/media`, mezclada con
las fotos reales de desarrollo. Sin la variable el comportamiento es el de hoy.

## D5 — Las peticiones HTTP se prueban llamando a los handlers, sin levantar servidor (2026-11-25)

Un helper importa los handlers de `src/app/(payload)/api/[...slug]/route.ts` y de
`src/app/api/sitios/sabrina/route.ts` y los llama con un `Request` armado a mano.

**Por qué:** hay reglas que solo se evalúan en la capa REST y no en la API local: el tope de
tamaño de archivo (`abortOnLimit`), el filtro de formatos y el alta de usuarios (el registro de
una colección de autenticación saltea `access.create`, ver el comentario de `Usuarios.ts`).
Llamar al handler prueba el mismo código que corre en producción sin el costo de un servidor.

## D6 — Los tests describen comportamiento; los roles solo se nombran en las fábricas (2026-11-25)

Ningún archivo de test menciona `super_admin` ni `tenant_editor`. Los usuarios se crean con
`crearEditora(clienta)` y `crearAdministradorAxs()`, definidas en `tests/soporte/fabricas.ts`.

**Por qué:** el proyecto 2 reemplaza los roles por perfiles y permisos. Si los roles viven en un
solo archivo, ese cambio toca las fábricas y los tests quedan igual, que es lo que permite
usarlos para comprobar que el cambio no rompió el aislamiento.

## D7 — Como el código ya existe, cada grupo de tests se valida rompiendo la regla (2026-11-25)

Estos tests se escriben sobre código que ya funciona, así que no hay un rojo natural antes del
verde. Para cada grupo, la tarea indica una regla del código que se rompe a mano, se confirma
que el test falla y se revierte.

**Por qué:** un test que nunca se vio fallar no demuestra nada. Es el reemplazo del paso rojo
del TDD para este proyecto. Desde el proyecto 2 se trabaja con test primero.

## D8 — El CI no construye el sitio de Sabrina (2026-11-25)

El workflow corre typecheck, lint, tests, build del CMS y `pnpm audit`. El build del sitio de
Sabrina queda afuera.

**Por qué:** ese build le pide el contenido a un CMS en marcha. Levantar el CMS con datos dentro
del CI es trabajo del proyecto 8 (publicación). Queda anotado como diferido.

## D9 — `aMedioDto` no se extrae del endpoint (2026-11-25)

La conversión de un medio al DTO se cubre con el test del endpoint, no con un test unitario.

**Por qué:** vive dentro de `route.ts`, y un archivo de ruta de Next no puede exportar otras
funciones. Extraerla es tocar código que el proyecto 3 va a reescribir.

## D10 — Los supuestos del diseño se cumplieron en Node 26 (2026-11-25)

La tarea 1 comprobó los cuatro supuestos que estaban sin verificar: Vitest corre en Node 26,
`getPayload` arranca bajo Vitest, `payload.db.migrate({ migrations })` arma una base vacía y los
handlers de las rutas responden sin servidor. El diseño sigue como estaba.

**Por qué importa:** el CLI de Payload falla en Node 26 por un defecto de `tsx` (D8 de
`2026-11-feat-cms-subida-imagenes`). Vitest no usa `tsx`, así que el problema no lo alcanza.

## D11 — Cerrar Payload en los tests exige cortar las conexiones a mano (2026-11-25)

`payload.db.destroy()` no cierra el pool de conexiones de `pg`, y `pool.end()` no termina nunca
porque el adaptador de Postgres toma un cliente al conectar y no lo devuelve. El arnés cierra
con `cerrarPayload()`: llama a `destroy()`, dispara `pool.end()` sin esperarlo y corta las
conexiones de esa base con `pg_terminate_backend`. Recién ahí clona o borra la base.

**Por qué:** Postgres no deja clonar ni borrar una base que tiene conexiones abiertas. Sin este
cierre la primera corrida quedaba colgada. Es comportamiento de Payload 3.85.1; al actualizar
Payload hay que revisar si sigue haciendo falta.

## D12 — No se instala una versión publicada hace menos de dos semanas (2026-11-25)

Vitest queda en una versión con al menos dos semanas de publicada, no en la última.

**Por qué:** la última (5.1.2) se había publicado el mismo día de la instalación. Una versión
recién publicada no tuvo tiempo de que se detecte un paquete comprometido. El costo es perder
uno o dos parches menores. Vale como criterio para toda dependencia nueva.

## D13 — `pnpm audit` ya fallaba antes de este cambio (2026-11-25)

La auditoría reporta 140 vulnerabilidades (9 críticas, 61 altas), todas anteriores a este
cambio. Las críticas están en `next` (5) y `payload` (4). Este cambio no las arregla.

**Por qué no se arregla acá:** actualizar Next y Payload es un cambio con riesgo propio y el
ADR-003 fija sus versiones. Conviene hacerlo con la suite ya andando, como cambio aparte:
`chore: actualizar dependencias`, inmediatamente después de este. Hasta entonces el CI corre la
auditoría en un job que informa pero no bloquea.

## D14 — La validación se hace regla por regla y cada test usa sus propios datos (2026-11-25)

Amplía D7. Para cada regla del código se hace un ciclo aparte: se rompe esa sola regla, se
confirma que falle al menos un test que la nombra y se revierte. Los tests que editan o borran
crean dentro del mismo test los datos que tocan; los datos compartidos son solo de lectura.

**Por qué:** en la tarea 3 se había roto una sola regla de nueve, y con esa regla rota un test
siguió en verde porque otro test ya había borrado el dato que leía. Un test que comparte datos
que otro modifica puede pasar por la razón equivocada.

## D15 — Hallazgos del aislamiento entre clientas: sin defectos, con notas para el proyecto 2 (2026-11-25)

Todo lo que debía rechazarse se rechaza. Lo que conviene saber antes de reemplazar los roles:

- Leer por id un documento ajeno responde "no encontrado"; editarlo o borrarlo responde
  "prohibido". La diferencia deja saber si un identificador existe.
- El acceso por campo descarta en silencio el valor no permitido (`clienta`, `rol`) en vez de
  rechazar la operación entera.
- En `Usuarios`, leer y editar usan el filtro por clienta: una editora puede leer y editar a
  cualquier usuaria de su misma clienta, no solo a sí misma. Hoy hay una usuaria por clienta;
  importa cuando las clientas puedan delegar.
- El campo `clienta` de `Medios` tiene dos defensas: el hook cubre solo el alta y el acceso por
  campo es la única defensa al editar.

**Por qué se registra:** son decisiones de diseño que el motor de permisos tiene que tomar a
conciencia, no heredar por accidente.

## D16 — La lista de formatos permitidos es la única barrera contra archivos no válidos (2026-11-25)

Con `mimeTypes` puesto en `Medios.ts`, Payload revisa el contenido real del archivo y rechaza
un SVG aunque se llame `foto.png` y declare ser PNG. Al quitar `mimeTypes` a propósito, el GIF,
el SVG y el SVG disfrazado se aceptaron los tres.

**Por qué importa:** detrás de esa lista no hay otra capa. Los archivos se sirven desde el
origen del CMS, así que un SVG aceptado puede llevar scripts. La lista no se quita ni se amplía
sin revisar este punto. Los tests de la tarea 4 la cubren.

## D17 — Superar el tope de 10 MB deja un error interno sin atender en Payload 3.85.1 (2026-11-25)

El CMS rechaza bien el archivo (responde 413 y no guarda nada). Pero después de responder, el
lector de formularios de Payload deja una promesa rechazada sin manejar ("Unexpected end of
form"). Los tests la capturan y exigen que sea exactamente esa.

**Sin resolver:** qué efecto tiene en el servidor real (si solo queda en el registro o si puede
tumbar el proceso). Se investiga en el cambio de actualización de dependencias. Si una versión
nueva de Payload lo arregla, el test del 413 tarda 10 segundos más: es la señal para quitar el
rodeo.

## D18 — El alta de usuarios tiene dos defensas y cada una tiene su test (2026-11-25)

El comentario de cabecera de `Usuarios.ts` dice que el alta por HTTP saltea `access.create`. En
Payload 3.85.1 no es así: `access.create` sí se evalúa. Junto con el hook `beforeChange` son dos
defensas redundantes y cualquiera de las dos alcanza para rechazar el alta.

Los tests por HTTP comprueban el resultado, y además hay un test que fija cada defensa por
separado.

**Por qué:** el proyecto 2 reescribe las dos. Con solo los tests por HTTP, romper una sola
pasaría inadvertido. Corregir el comentario de `Usuarios.ts` queda para ese proyecto, porque
este cambio no toca el código del CMS.

## D19 — Con el contenido vacío, el endpoint público responde 422 (2026-11-25)

`GET /api/sitios/sabrina` sobre una base sin contenido cargado responde 422 con
`{ "error": "Contenido del sitio incompleto" }`. El plan preveía 200 o 500. El test fija ese
comportamiento y comprueba que la respuesta no filtra detalle interno.

**Por qué importa:** es lo que va a recibir un sitio recién dado de alta antes de que se le
cargue contenido. El proyecto de alta con vista previa tiene que contemplarlo.

## D20 — Deuda: la salida de los tests no está limpia (2026-11-25)

Dos fuentes de ruido que no vienen de los tests:

- Un aviso de `pg` al correr la carga inicial ("client.query() when the client is already
  executing a query"). Indica consultas simultáneas sobre una misma conexión y dejaría de
  funcionar en `pg` 9.
- Los registros de Payload por cada rechazo esperado.

**Por qué no se arregla acá:** el primero viene de Payload o de la carga inicial y se revisa al
actualizar dependencias. El segundo se resuelve con un registro silencioso en el arnés; queda
para cuando moleste.
