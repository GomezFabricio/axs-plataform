/** Construye el enlace de WhatsApp a partir del numero crudo del contenido. */
export function enlaceWhatsapp(numero: string): string {
  const limpio = numero.replace(/[^0-9]/g, "");
  return `https://wa.me/${limpio}`;
}
