import { SitioSabrinaSchema } from "./esquemas";
import type { SitioSabrina } from "./tipos";

/**
 * Capa fina entre los sitios y el CMS. Lee la base URL del CMS desde entorno
 * (preferir CMS_URL server-side; el fetch corre en un Server Component del sitio),
 * con fallback a NEXT_PUBLIC_CMS_URL. Cuando se pasa baseUrl en las opciones,
 * esa toma prioridad (útil para tests y overrides puntuales).
 *
 * La firma y el tipo de retorno no cambian: misma interfaz que antes, sin que el
 * sitio lo note. El panel de Payload es ahora la fuente de verdad del contenido.
 */

export interface OpcionesCliente {
  /** Base URL de la API del CMS. Cuando se omite, se lee de process.env. */
  baseUrl?: string;
}

export async function obtenerSitioSabrina(opciones: OpcionesCliente = {}): Promise<SitioSabrina> {
  const baseUrl =
    opciones.baseUrl ??
    process.env["CMS_URL"] ??
    process.env["NEXT_PUBLIC_CMS_URL"] ??
    "http://localhost:3001";

  // `next: { revalidate }` es una extensión de Next.js al fetch nativo.
  // cms-client es un paquete TS plano (sin tipos de Next), por eso se castea.
  const fetchOptions = { next: { revalidate: 60 } } as RequestInit;
  const res = await fetch(`${baseUrl}/api/sitios/sabrina`, fetchOptions);

  if (!res.ok) {
    throw new ErrorCms(res.status, "No se pudo obtener el sitio");
  }

  return SitioSabrinaSchema.parse(await res.json());
}

export class ErrorCms extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorCms";
  }
}
