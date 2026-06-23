import type { CSSProperties } from "react";

/**
 * Icono de la libreria Phosphor via web font (regla anti-IA: iconos de libreria,
 * nunca SVG dibujados a mano). El nombre llega como string desde el contenido del
 * CMS, ej. "video-camera" -> <i class="ph-light ph-video-camera">.
 */
export function Icono({
  nombre,
  peso = "light",
  size = 24,
  color = "var(--acento)",
  style,
}: {
  nombre: string;
  peso?: "light" | "regular" | "fill";
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <i
      className={`ph-${peso} ph-${nombre}`}
      aria-hidden="true"
      style={{ fontSize: size, color, lineHeight: 1, ...style }}
    />
  );
}
