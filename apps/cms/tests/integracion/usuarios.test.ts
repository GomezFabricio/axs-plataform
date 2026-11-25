import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import type { Clienta, Usuario } from "@/payload-types";
import {
  crearAdministradorAxs,
  crearClienta,
  crearEditora,
  obtenerPayloadDeTest,
} from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/**
 * Alta de usuarios e inicio de sesión por HTTP. El alta se prueba en la capa REST porque el
 * registro de una colección de autenticación tiene su propio camino (el comentario de Usuarios
 * dice que saltea `access.create`). Medido con Payload 3.85.1, el alta se rechaza aunque se
 * quite cualquiera de las dos defensas (`access.create` o el hook `beforeChange`); solo con
 * las dos quitadas el alta anónima pasa. Estos tests fijan el resultado, no cuál lo logra.
 *
 * Cada test crea los usuarios que necesita con correos propios, y todo rechazo comprueba el
 * estado y también el efecto: que no quedó ningún usuario con ese correo.
 */

const CLAVE_NUEVA = "clave-nueva-de-prueba-2026";

let payload: Payload;
let secuencia = 0;

function correoNuevo(): string {
  secuencia += 1;
  return `alta-${secuencia}@prueba.test`;
}

/** Usuarios con ese correo, buscados con la API local sin reglas de acceso. */
async function usuariosConCorreo(correo: string): Promise<Usuario[]> {
  const { docs } = await payload.find({
    collection: "usuarios",
    where: { email: { equals: correo } },
    overrideAccess: true,
    limit: 10,
  });
  return docs;
}

async function contarUsuarios(): Promise<number> {
  const { totalDocs } = await payload.count({ collection: "usuarios", overrideAccess: true });
  return totalDocs;
}

/** El id de una relación, venga poblada o no. */
function idDe(relacion: number | { id: number } | null | undefined): number | null {
  if (relacion === null || relacion === undefined) return null;
  return typeof relacion === "number" ? relacion : relacion.id;
}

describe("usuarios por HTTP", () => {
  let clienta: Clienta;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
    clienta = await crearClienta({ nombre: "Clienta de usuarios", slug: "clienta-usuarios" });
  });

  describe("alta de usuarios", () => {
    it("rechaza el alta sin sesión con 403 y no crea el usuario", async () => {
      const correo = correoNuevo();

      const respuesta = await pedir("POST", "/api/usuarios", {
        json: { email: correo, password: CLAVE_NUEVA },
      });

      expect(respuesta.status).toBe(403);
      expect(await usuariosConCorreo(correo)).toHaveLength(0);
    });

    it("rechaza el alta de una editora con 403 y no crea el usuario", async () => {
      const editora = await crearEditora(clienta);
      const correo = correoNuevo();

      const respuesta = await pedir("POST", "/api/usuarios", {
        como: editora,
        json: { email: correo, password: CLAVE_NUEVA, clienta: clienta.id },
      });

      expect(respuesta.status).toBe(403);
      expect(await usuariosConCorreo(correo)).toHaveLength(0);
    });

    it("permite el alta a la administradora de Axs con 201 y deja el usuario creado", async () => {
      const administradora = await crearAdministradorAxs();
      const correo = correoNuevo();

      const respuesta = await pedir("POST", "/api/usuarios", {
        como: administradora,
        json: { email: correo, password: CLAVE_NUEVA, clienta: clienta.id },
      });

      expect(respuesta.status).toBe(201);
      const creados = await usuariosConCorreo(correo);
      expect(creados).toHaveLength(1);
      expect(idDe(creados[0]!.clienta)).toBe(clienta.id);
    });
  });

  describe("inicio de sesión", () => {
    it("con la clave correcta responde 200 y devuelve un token", async () => {
      const editora = await crearEditora(clienta);

      const respuesta = await pedir("POST", "/api/usuarios/login", {
        json: { email: editora.email, password: editora.clave },
      });

      expect(respuesta.status).toBe(200);
      const cuerpo = (await respuesta.json()) as { token?: string; user?: Usuario };
      expect(cuerpo.token).toBeTruthy();
      expect(cuerpo.user?.id).toBe(editora.id);
    });

    it("con una clave incorrecta responde 401 y no devuelve token", async () => {
      const editora = await crearEditora(clienta);

      const respuesta = await pedir("POST", "/api/usuarios/login", {
        json: { email: editora.email, password: `${editora.clave}-equivocada` },
      });

      expect(respuesta.status).toBe(401);
      const cuerpo = (await respuesta.json()) as { token?: string };
      expect(cuerpo.token).toBeUndefined();
    });

    it("GET /api/usuarios/me con el token de una editora devuelve su usuario y su clienta", async () => {
      const editora = await crearEditora(clienta);

      const respuesta = await pedir("GET", "/api/usuarios/me", { como: editora });

      expect(respuesta.status).toBe(200);
      const { user } = (await respuesta.json()) as { user: Usuario | null };
      expect(user?.id).toBe(editora.id);
      expect(user?.email).toBe(editora.email);
      expect(idDe(user?.clienta)).toBe(clienta.id);
    });
  });

  describe("primer registro", () => {
    it("cuando ya hay usuarios responde 403 y no crea ninguno", async () => {
      await crearAdministradorAxs();
      const correo = correoNuevo();
      const usuariosAntes = await contarUsuarios();
      expect(usuariosAntes).toBeGreaterThan(0);

      const respuesta = await pedir("POST", "/api/usuarios/first-register", {
        json: { email: correo, password: CLAVE_NUEVA },
      });

      expect(respuesta.status).toBe(403);
      expect(await usuariosConCorreo(correo)).toHaveLength(0);
      expect(await contarUsuarios()).toBe(usuariosAntes);
    });
  });
});
