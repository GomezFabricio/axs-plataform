# ADR-004 — Tests de integracion contra un Postgres real, con una base por archivo

**Fecha:** 2026-11-25
**Estado:** aceptado
**Cambio origen:** `2026-11-test-cms-suite`

## Contexto

El CMS no tenia tests ni CI. Los dos proyectos siguientes reescriben sus partes mas delicadas: el control de acceso pasa de dos roles fijos a perfiles y permisos, y el contenido del sitio pasa de un global fijo a una biblioteca de secciones. Hacia falta una red que mostrara si esos cambios rompen el aislamiento entre clientas o cambian lo que ve el publico.

En este CMS las reglas que importan no son funciones sueltas: son lo que Payload deja pasar cuando combina control de acceso, acceso por campo, hooks y la capa HTTP. Algunas reglas solo se evaluan en HTTP (tope de tamano de archivo, filtro de formatos).

## Decision

1. **Los tests corren contra un Postgres real**, con Vitest. No se simula Payload ni la base.
2. **Una base por archivo de test.** Al empezar la corrida se crea una base plantilla y se le corren las migraciones reales una sola vez. Cada archivo de test clona la plantilla, trabaja sobre su copia y la borra. Cada corrida lleva un prefijo al azar y limpia solo lo suyo.
3. **El esquema de test sale de las migraciones.** `push` queda apagado cuando `NODE_ENV` es `test`.
4. **Lo que solo vive en HTTP se prueba llamando a los handlers de las rutas**, sin levantar servidor.
5. **Los tests describen comportamiento y no nombran roles.** Los usuarios de prueba salen de fabricas (`crearEditora`, `crearAdministradorAxs`), que son el unico lugar con nombres de rol.
6. **Un test se valida viendolo fallar.** Se rompe a mano la regla que nombra, se confirma que falla y se revierte. Antes de cerrar un cambio que toque permisos o contenido publico, se rompen las reglas afectadas sobre una copia y se comprueba que la suite lo note.

## Alternativas consideradas

- **Tests unitarios con simulaciones.** Rapidos y sin base. Descartados: una simulacion del control de acceso no demuestra que el control de acceso funcione.
- **Una sola base compartida por toda la corrida.** Mas simple. Descartada: el contenido del sitio es un global unico, asi que dos archivos que lo modifiquen se pisarian y los tests dependerian del orden.
- **Pruebas HTTP contra el contenedor Docker.** Lo mas parecido a produccion. Descartadas como base por lentas y dificiles de depurar; pueden sumarse como prueba de humo del deploy.
- **Dejar `push` encendido en test.** Descartado: el esquema lo generaria Payload desde la configuracion y una migracion rota o faltante no se veria nunca.

## Consecuencias

- La suite necesita un Postgres disponible, en local y en CI. En local es el de `apps/cms/docker-compose.yml`; en CI, un servicio del job.
- Hay dos cambios en el codigo del CMS hechos solo para poder testear, sin efecto en desarrollo ni en produccion: `push` apagado en test y la carpeta de medios configurable con `MEDIA_DIR`.
- Cambiar los roles por permisos toca las fabricas, no los tests. Eso es lo que permite usar la suite para comprobar que el cambio no rompio nada.
- Cerrar Payload en los tests exige cortar las conexiones a mano, por un comportamiento de Payload 3.85.1. Hay que revisarlo al actualizar Payload.
- La suite no prueba la migracion de una base con contenido ya cargado. El proyecto de la biblioteca de secciones tiene que cubrirlo antes de migrar.

## Referencias

- `docs/auditoria/cambios/2026-11-test-cms-suite/decisiones.md` (D1 a D23).
- `apps/cms/tests/soporte/` (arnes).
