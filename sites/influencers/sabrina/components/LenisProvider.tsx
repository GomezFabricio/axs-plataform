"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll con Lenis. Framer Motion (useScroll) lee el scroll nativo que
 * Lenis maneja, asi que el hero crossfade y los reveals quedan sincronizados.
 * Si el usuario pidio menos movimiento, Lenis no se monta: scroll nativo y listo.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let id = 0;
    function raf(tiempo: number) {
      lenis.raf(tiempo);
      id = requestAnimationFrame(raf);
    }
    id = requestAnimationFrame(raf);

    // Lenis no intercepta anchors por su cuenta: lo hacemos a mano para que los
    // saltos (#top, #pilares, #contacto) sean scroll suave y no un corte seco.
    // El offset compensa el header fixed para que la seccion no quede tapada.
    function alturaHeader() {
      const header = document.querySelector("header");
      return header ? header.getBoundingClientRect().height + 12 : 0;
    }
    function onClick(evento: MouseEvent) {
      const ancla = (evento.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!ancla) return;
      const href = ancla.getAttribute("href");
      if (!href || href === "#") return;
      const idDestino = href.slice(1);
      if (idDestino === "top") {
        evento.preventDefault();
        lenis.scrollTo(0);
        return;
      }
      const destino = document.getElementById(idDestino);
      if (!destino) return; // anchor sin destino: dejar comportamiento nativo
      evento.preventDefault();
      lenis.scrollTo(destino, { offset: -alturaHeader() });
    }
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
