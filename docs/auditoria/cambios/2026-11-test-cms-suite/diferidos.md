# Diferidos — Tests del CMS

**Cambio:** `2026-11-test-cms-suite`

Lo que las revisiones encontraron y se decidió no arreglar dentro de este cambio. Nada de esto
abre un hueco en lo que la suite protege. Se revisa al tocar cada archivo.

## Arnés (`apps/cms/tests/soporte/`)

- La limpieza ante Ctrl-C o SIGTERM no tiene tope de tiempo: si Postgres se cuelga, el proceso
  queda esperando hasta una segunda señal. Arreglo sugerido: un temporizador de 10 a 15 segundos
  que restaure `process.exit` y salga.
- Entre la creación de la plantilla y el registro de las señales hay una ventana corta en la que
  un Ctrl-C deja la plantilla huérfana. Se arregla registrando las señales antes.
- Si llega una señal mientras corren las migraciones, una migración que falla no corta y la
  salida confunde. El código de salida sigue siendo de error.
- Si se mata el proceso con `kill -9` no corre ninguna limpieza. Para eso está el comando manual
  al principio de `preparacionGlobal.ts`.
- Con `push` encendido en la plantilla, la corrida se quedaría esperando una pregunta de Payload
  en vez de fallar. Hoy no pasa porque `push` está apagado en test.
- Sin Postgres, el mensaje de ayuda sale precedido por "No test files found", que confunde. El
  test unitario del límite de peticiones también necesita Postgres, porque la preparación corre
  para todos los archivos.
- En el cierre por archivo, si fallan el cierre de Payload y el borrado de la base, el segundo
  error tapa al primero.
- Los nombres de base se escriben sin comillas en las sentencias SQL. Son hexadecimales y
  dígitos generados por el arnés, sin entrada externa.
- El contador por proceso de `preparacionArchivo.ts` supone que cada archivo corre en su propio
  proceso (el valor por defecto de Vitest).
- Aviso de dependencia opcional entre `vite` y `esbuild` al instalar.

## Tests

- `aislamiento.test.ts`: los dos tests que editan el contenido del sitio cambian el nombre del
  sitio y no lo restauran. Ningún test depende de ese valor. El campo `clienta` de `Medios`
  tiene dos defensas y el test del alta solo cae si se quitan las dos.
- `usuarios.test.ts`: el inicio de sesión con clave incorrecta no comprueba que la respuesta no
  traiga datos del usuario, y no hay caso de correo inexistente.
- `medios.test.ts`: los rechazos fijan los códigos 400 y 413, más estrictos que "no es 201". Si
  Payload arregla el error sin atender de D17, el test del tope tarda 10 segundos más.
- `endpoint-sitio.test.ts`: el ancho y el alto de las imágenes solo se comprueban como
  positivos; la rama que lee la IP de `x-real-ip` no tiene test; los bucles de 60 peticiones
  suponen que no pasa un minuto entre la primera y la última.
- `rateLimit.test.ts`: no se afirma que la primera clave quedó agotada cuando la segunda pasa,
  ni la hora de reinicio de la ventana nueva.
- `carga-inicial.test.ts` y `endpoint-sitio.test.ts` repiten la forma de reconocer una imagen
  dentro del contenido.
- `arnes.test.ts`: el test de los medios supone que la corrida se lanza desde `apps/cms`.

## CI

- El job de auditoría va a estar en rojo hasta el cambio de dependencias, así que una
  vulnerabilidad nueva no se distingue de las previas.
- La versión de Node del CI sale de `.nvmrc` (`26`); la imagen Docker fija `26.12.0`.
- El job de auditoría instala todas las dependencias aunque solo necesita el lockfile.
