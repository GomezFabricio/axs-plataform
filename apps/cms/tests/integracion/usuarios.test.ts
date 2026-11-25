import type { Access, Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import { Usuarios } from "@/collections/Usuarios";
import type { Clienta, Usuario } from "@/payload-types";
import {
  crearAdministradorAxs,
  crearClienta,
  crearEditora,
  obtenerPayloadDeTest,
} from "../soporte/fabricas";
import type { UsuarioDeTest } from "../soporte/fabricas";
import { pedir } from "../soporte/http";

/**
 * Alta de usuarios e inicio de sesión por HTTP. El alta se rechaza sin sesión y para una
 * editora, y solo la administradora de Axs puede hacerla. Cada defensa del alta (la regla
 * `access.create` y el hook `beforeChange` de Usuarios) también se fija por separado, con su
 * propio test, para que una regresión de una sola no quede tapada por la otra.
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

  describe("cada defensa del alta por separado", () => {
    it("el hook rechaza el alta aun sin reglas de acceso y sin usuario", async () => {
      const correo = correoNuevo();

      // Con overrideAccess el control de acceso no se evalúa: solo el hook puede rechazar. Se
      // exige su 403: un error de validación (por ejemplo, si el rol dejara de tener valor por
      // defecto) también rechazaría el alta, pero no probaría que el hook sigue ahí.
      await expect(
        payload.create({
          collection: "usuarios",
          // Como en el alta por HTTP, solo se manda correo y clave: el rol lo cubre el valor por
          // defecto de la colección, que la Local API no conoce al tipar `data`.
          data: { email: correo, password: CLAVE_NUEVA } as Omit<Usuario, "id" | "createdAt" | "updatedAt">,
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ status: 403 });

      expect(await usuariosConCorreo(correo)).toHaveLength(0);
    });

    describe("regla access.create de la colección", () => {
      /** Evalúa la regla con el usuario dado. La regla solo lee `req.user`. */
      async function puedeCrear(usuario?: UsuarioDeTest): Promise<boolean> {
        const regla = Usuarios.access?.create as Access;
        // El argumento completo de Access tiene muchos campos que esta regla no lee: se arma
        // solo `req.user` y se fuerza el tipo, únicamente acá.
        const argumento = { req: { user: usuario } } as unknown as Parameters<Access>[0];
        return (await regla(argumento)) === true;
      }

      it("la rechaza para una editora", async () => {
        expect(await puedeCrear(await crearEditora(clienta))).toBe(false);
      });

      it("la rechaza sin usuario", async () => {
        expect(await puedeCrear(undefined)).toBe(false);
      });

      it("la permite a la administradora de Axs", async () => {
        expect(await puedeCrear(await crearAdministradorAxs())).toBe(true);
      });
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

    it("el token que entrega el login sirve en GET /api/usuarios/me", async () => {
      const editora = await crearEditora(clienta);

      const login = await pedir("POST", "/api/usuarios/login", {
        json: { email: editora.email, password: editora.clave },
      });
      const { token } = (await login.json()) as { token: string };
      // El token se manda a mano, sin `como`: es el que emitió el endpoint HTTP de login.
      const respuesta = await pedir("GET", "/api/usuarios/me", {
        cabeceras: { Authorization: `JWT ${token}` },
      });

      expect(respuesta.status).toBe(200);
      const { user } = (await respuesta.json()) as { user: Usuario | null };
      expect(user?.id).toBe(editora.id);
      expect(idDe(user?.clienta)).toBe(clienta.id);
    });

    it("GET /api/usuarios/me devuelve a cada editora su propia clienta", async () => {
      const otraClienta = await crearClienta({ nombre: "Otra clienta", slug: "otra-clienta" });
      const editora = await crearEditora(clienta);
      const otraEditora = await crearEditora(otraClienta);

      const propia = await pedir("GET", "/api/usuarios/me", { como: editora });
      const ajena = await pedir("GET", "/api/usuarios/me", { como: otraEditora });

      const { user: usuaria } = (await propia.json()) as { user: Usuario | null };
      const { user: otraUsuaria } = (await ajena.json()) as { user: Usuario | null };
      expect(usuaria?.id).toBe(editora.id);
      expect(idDe(usuaria?.clienta)).toBe(clienta.id);
      expect(otraUsuaria?.id).toBe(otraEditora.id);
      expect(idDe(otraUsuaria?.clienta)).toBe(otraClienta.id);
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
