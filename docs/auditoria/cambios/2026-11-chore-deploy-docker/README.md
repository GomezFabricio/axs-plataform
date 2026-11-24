# Deploy: imágenes Docker del CMS y de Sabrina

**Tipo:** chore
**Estado:** en curso (hecho el entorno local; falta producción)
**Nivel de ceremonia:** Rápido. Expediente registrado después de la parte local.
**Estructural:** false
**Commit:** `dc525f0` en `feat/cms-docker-e-imagenes`
**Áreas afectadas:** `apps/cms/Dockerfile`, `sites/influencers/sabrina/Dockerfile`,
`compose.local.yaml`, `.dockerignore`, `apps/cms/next.config.ts`,
`sites/influencers/sabrina/next.config.ts`, `docs/arquitectura/overview.md`

---

## Qué

Fase 2.2 del roadmap. Imágenes Docker multi-stage para el CMS y para el sitio de Sabrina, con la
salida `standalone` de Next, y un `compose.local.yaml` que levanta los dos contra el Postgres local.
Lo que falta es el despliegue real: compose de producción, VPS con Coolify y dominio.

## Por qué

Es el paso previo para publicar el sitio de Sabrina. Probar las imágenes en local primero aísla
los problemas de empaquetado de los problemas del servidor.

## Cómo se usa en local

```bash
docker compose -f compose.local.yaml up -d --build
```

- CMS: `http://localhost:3001` (panel en `/admin`).
- Sitio de Sabrina: `http://localhost:3002`.
- El CMS lee `apps/cms/.env` y monta `apps/cms/media` para que las fotos subidas sobrevivan a los
  rebuilds y se compartan con `pnpm dev`.

## Notas técnicas

- Las imágenes instalan solo el workspace que necesitan (`pnpm install --filter "@axs/<pkg>..."`)
  y corren como el usuario `node`.
- `outputFileTracingRoot` apunta a la raíz del monorepo para que `standalone` incluya los paquetes
  del workspace.
- El build del sitio recibe `CMS_URL`. Si Docker reutiliza la caché del build, la home prerenderada
  puede salir vieja; la ISR (revalidate 60) la refresca en el primer request.
