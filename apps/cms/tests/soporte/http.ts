import { NextRequest } from "next/server";
import * as rutaRest from "@/app/(payload)/api/[...slug]/route";
import * as rutaSitioSabrina from "@/app/api/sitios/sabrina/route";
import { obtenerPayloadDeTest } from "./fabricas";
import type { UsuarioDeTest } from "./fabricas";

type Metodo = "GET" | "POST" | "PATCH" | "DELETE";

/** Origen de las peticiones armadas a mano. Los handlers no lo usan para enrutar. */
const ORIGEN = "http://localhost:3001";

/**
 * Hace una petición HTTP llamando directo al handler de la ruta de Next, sin servidor.
 * `/api/sitios/sabrina` va a su handler; el resto de `/api/*` al de `[...slug]` de Payload.
 * Con `como`, inicia sesión con ese usuario y manda su token.
 */
export async function pedir(
  metodo: Metodo,
  ruta: string, // "/api/medios", "/api/sitios/sabrina"
  opciones?: {
    como?: UsuarioDeTest; // inicia sesión y manda el token
    json?: unknown;
    archivo?: { nombre: string; tipo: string; contenido: Buffer };
    campos?: Record<string, unknown>; // se mandan en "_payload" junto al archivo
    cabeceras?: Record<string, string>;
  },
): Promise<Response> {
  // Los handlers piden Payload con la misma configuración: así comparten la instancia del archivo.
  const payload = await obtenerPayloadDeTest();
  const cabeceras = new Headers(opciones?.cabeceras);

  if (opciones?.como) {
    const { token } = await payload.login({
      collection: "usuarios",
      data: { email: opciones.como.email, password: opciones.como.clave },
    });
    cabeceras.set("Authorization", `JWT ${token}`);
  }

  let cuerpo: BodyInit | undefined;
  if (opciones?.archivo) {
    const formulario = new FormData();
    const { nombre, tipo, contenido } = opciones.archivo;
    formulario.append("file", new Blob([new Uint8Array(contenido)], { type: tipo }), nombre);
    formulario.append("_payload", JSON.stringify(opciones.campos ?? {}));
    cuerpo = formulario;
  } else if (opciones?.json !== undefined) {
    cabeceras.set("Content-Type", "application/json");
    cuerpo = JSON.stringify(opciones.json);
  }

  const peticion = new NextRequest(new URL(ruta, ORIGEN), {
    method: metodo,
    headers: cabeceras,
    body: cuerpo,
  });
  const { pathname } = peticion.nextUrl;

  if (pathname === "/api/sitios/sabrina") {
    if (metodo !== "GET") throw new Error(`/api/sitios/sabrina solo atiende GET, no ${metodo}`);
    return rutaSitioSabrina.GET(peticion);
  }
  if (!pathname.startsWith("/api/")) throw new Error(`Ruta fuera de la API: ${ruta}`);

  const slug = pathname.slice("/api/".length).split("/").filter(Boolean).map(decodeURIComponent);
  return rutaRest[metodo](peticion, { params: Promise.resolve({ slug }) });
}
