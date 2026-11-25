# Tareas — Deploy: imágenes Docker del CMS y de Sabrina

**Cambio:** `2026-11-chore-deploy-docker`

---

## Local

- [x] **T1.** `output: "standalone"` y `outputFileTracingRoot` en los `next.config.ts` del CMS y
  de Sabrina.
- [x] **T2.** Dockerfiles multi-stage del CMS y de Sabrina, usuario no root.
- [x] **T3.** `.dockerignore` (sin `node_modules`, `.next`, `.env*`, media ni docs).
- [x] **T4.** `compose.local.yaml` con los dos servicios y el volumen de media.
- [x] **T5.** Levantar en local y verificar CMS en `:3001` y sitio en `:3002`.
- [x] **T6.** Commit `dc525f0`.

## Producción (pendiente)

- [ ] **T7.** Decidir cómo corren las migraciones en el deploy. La imagen del CMS (salida standalone) probablemente no trae el CLI
  de Payload y `payload migrate` falla en Node 26 (D8 de `2026-11-feat-cms-subida-imagenes`).
- [ ] **T8.** Compose de producción (Postgres propio, volumen persistente de media, secretos fuera
  de la imagen).
- [ ] **T9.** VPS con Coolify.
- [ ] **T10.** Dominio y HTTPS.
- [ ] **T11.** Revisar el rate limiter in-memory (D1 del hardening): sirve con una sola instancia
  del CMS; si se escala, hay que reemplazarlo.
