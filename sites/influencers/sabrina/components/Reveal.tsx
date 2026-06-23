"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/**
 * Entrada al hacer scroll: opacidad + leve subida, una sola vez, con ease-out.
 * Usa whileInView (IntersectionObserver por debajo), nunca scroll listeners.
 * Si el usuario pidio menos movimiento, renderiza estatico.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "figure" | "section";
}) {
  const reducido = useReducedMotion();
  const Motion = motion[as];

  if (reducido) {
    const Plano = as;
    return (
      <Plano className={className} style={style}>
        {children}
      </Plano>
    );
  }

  return (
    <Motion
      className={className}
      style={style}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </Motion>
  );
}
