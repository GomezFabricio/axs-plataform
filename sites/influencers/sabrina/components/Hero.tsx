"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { EscenaHero, SeccionHero } from "@axs/cms-client";
import { Icono } from "./Icono";

/**
 * Hero fijo (sticky) con crossfade por scroll, SIN frame-sequence (Anexo A del PRD).
 * Una seccion alta (una pantalla por escena); dentro, un contenedor sticky donde las
 * escenas hacen crossfade segun el progreso de scroll. Solo opacity/transform.
 *
 * Degrada: en mobile o con prefers-reduced-motion se muestra la primera escena estatica
 * a pantalla completa, sin scroll-jacking.
 */
export function Hero({ hero, waLink }: { hero: SeccionHero; waLink: string }) {
  const reducido = useReducedMotion();
  const [esMobile, setEsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const aplicar = () => setEsMobile(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  // Mobile: carrusel swipeable (gesto del usuario, sin secuestrar el scroll vertical).
  // Desktop + reduced-motion: hero estatico (sin scroll-jacking). Desktop normal: crossfade.
  if (esMobile) {
    return <HeroMobileCarrusel hero={hero} waLink={waLink} />;
  }
  if (reducido) {
    return <HeroEstatico hero={hero} waLink={waLink} />;
  }
  return <HeroCrossfade hero={hero} waLink={waLink} />;
}

/**
 * Hero mobile (composicion editorial): figura a sangre completa como fondo y el texto
 * superpuesto abajo, sobre un velo suave que garantiza legibilidad. Carrusel por estado
 * (transform), navegable solo con flechitas + puntitos, sin swipe. Respeta
 * prefers-reduced-motion (cambio de escena instantaneo).
 */
function HeroMobileCarrusel({ hero, waLink }: { hero: SeccionHero; waLink: string }) {
  const [activo, setActivo] = useState(0);
  const reducido = useReducedMotion();
  const total = hero.escenas.length;

  function irA(i: number) {
    setActivo(Math.max(0, Math.min(total - 1, i)));
  }

  return (
    <section
      data-hero
      style={{
        position: "relative",
        height: "100svh",
        overflow: "hidden",
        background:
          "radial-gradient(120% 80% at 70% 16%, #FDF4F3 0%, #FCF9F8 55%, #FBF7F4 100%)",
      }}
    >
      <div style={{ position: "relative", height: "100%" }}>
        <div style={{ overflow: "hidden", height: "100%" }}>
          <div
            style={{
              display: "flex",
              height: "100%",
              transform: `translateX(-${activo * 100}%)`,
              transition: reducido ? "none" : "transform .5s var(--ease-suave)",
            }}
          >
            {hero.escenas.map((escena, i) => (
              <EscenaMobile
                key={i}
                escena={escena}
                index={i}
                total={total}
                hero={hero}
                waLink={waLink}
                activo={activo}
                irA={irA}
              />
            ))}
          </div>
        </div>

        <FlechaCarrusel direccion="left" onClick={() => irA(activo - 1)} deshabilitada={activo === 0} />
        <FlechaCarrusel direccion="right" onClick={() => irA(activo + 1)} deshabilitada={activo === total - 1} />
      </div>
    </section>
  );
}

/* Flecha sutil del carrusel mobile: a un lado, centrada verticalmente. Fondo claro
   semitransparente para legibilidad sobre texto o foto. Se oculta en los extremos. */
function FlechaCarrusel({
  direccion,
  onClick,
  deshabilitada,
}: {
  direccion: "left" | "right";
  onClick: () => void;
  deshabilitada: boolean;
}) {
  const lado =
    direccion === "left"
      ? { left: "clamp(6px,2vw,16px)" }
      : { right: "clamp(6px,2vw,16px)" };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitada}
      aria-label={direccion === "left" ? "Escena anterior" : "Escena siguiente"}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        ...lado,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        padding: 0,
        border: "none",
        borderRadius: "var(--radio-pill)",
        background: "rgba(253,250,249,.72)",
        boxShadow: "0 6px 16px -10px rgba(110,75,58,.5)",
        cursor: deshabilitada ? "default" : "pointer",
        opacity: deshabilitada ? 0 : 1,
        pointerEvents: deshabilitada ? "none" : "auto",
        transition: "opacity .25s var(--ease-suave)",
        zIndex: 4,
      }}
    >
      <Icono nombre={direccion === "left" ? "caret-left" : "caret-right"} size={22} color="var(--marron-claro)" />
    </button>
  );
}

/* Escena del hero mobile: figura a sangre + velo inferior + texto superpuesto. */
function EscenaMobile({
  escena,
  index,
  total,
  hero,
  waLink,
  activo,
  irA,
}: {
  escena: EscenaHero;
  index: number;
  total: number;
  hero: SeccionHero;
  waLink: string;
  activo: number;
  irA: (i: number) => void;
}) {
  const estiloTitulo = {
    fontWeight: 500,
    fontSize: "clamp(40px,9vw,60px)",
    lineHeight: 1.02,
    letterSpacing: "-.01em",
    margin: "0 0 14px",
    color: "var(--texto)",
  } as const;

  const lineaTitulo = escena.titulo.split("\n").map((linea, i, arr) => (
    <span key={i}>
      {linea}
      {i < arr.length - 1 && <br />}
    </span>
  ));

  return (
    <div
      aria-hidden={index === activo ? undefined : true}
      style={{ flex: "0 0 100%", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    >
      {/* Forma organica suave detras de la figura. */}
      <div
        style={{
          position: "absolute",
          top: "7%",
          left: "50%",
          transform: "translateX(-38%)",
          width: "min(82vw,440px)",
          height: "min(82vw,440px)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 45% 40%, #F7DCE0 0%, rgba(243,217,221,0) 70%)",
          zIndex: 1,
        }}
      />

      {/* Figura a sangre completa, anclada abajo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={escena.imagen.url}
        alt={escena.imagen.textoAlternativo}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "92%",
          width: "auto",
          maxWidth: "none",
          zIndex: 2,
          filter: "drop-shadow(0 24px 36px rgba(110,75,58,.2))",
        }}
      />

      {/* Velo inferior: lleva la figura hacia el fondo para que el texto se lea. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "64%",
          background:
            "linear-gradient(to top, #FCF9F8 6%, rgba(252,249,248,.93) 30%, rgba(252,249,248,.6) 62%, rgba(252,249,248,0) 100%)",
          zIndex: 3,
        }}
      />

      {/* Texto superpuesto, abajo. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 4,
          padding: "0 clamp(22px,6vw,40px) clamp(20px,4vh,32px)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: ".02em",
            color: "var(--acento-texto)",
            marginBottom: 14,
          }}
        >
          {escena.etiqueta}
        </div>

        {index === 0 ? (
          <h1 className="serif" style={estiloTitulo}>
            {lineaTitulo}
          </h1>
        ) : (
          <p className="serif" style={estiloTitulo}>
            {lineaTitulo}
          </p>
        )}

        <p
          style={{
            margin: 0,
            fontSize: "clamp(15px,4vw,17px)",
            lineHeight: 1.65,
            color: "var(--marron)",
            maxWidth: 460,
          }}
        >
          {escena.copete}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: "clamp(20px,3.4vh,28px)" }}>
          <a
            href={waLink}
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "var(--acento)",
              color: "#fff",
              padding: "15px 26px",
              borderRadius: "var(--radio-pill)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "var(--sombra-acento)",
            }}
          >
            <Icono nombre="whatsapp-logo" size={19} color="#fff" />
            {hero.ctaPrimario}
          </a>
          <a
            href="#pilares"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              color: "var(--marron)",
              padding: "15px 22px",
              borderRadius: "var(--radio-pill)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid #E7D8D2",
              background: "rgba(255,255,255,.6)",
            }}
          >
            {hero.ctaSecundario}
          </a>
        </div>

        {/* Puntitos: indicador + navegacion, bajo los CTAs. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "clamp(18px,3vh,26px)" }}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver escena ${i + 1} de ${total}`}
              aria-current={i === activo}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: i === activo ? 34 : 24,
                height: 36,
                padding: 0,
                border: "none",
                cursor: "pointer",
                background: "transparent",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: i === activo ? 34 : 10,
                  height: 10,
                  borderRadius: "var(--radio-pill)",
                  background: i === activo ? "var(--acento)" : "rgba(110,75,58,.28)",
                  transition: "width .25s var(--ease-suave), background .25s var(--ease-suave)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCrossfade({ hero, waLink }: { hero: SeccionHero; waLink: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const total = hero.escenas.length;

  // vh de scroll que dura cada escena antes de pasar a la siguiente. Mas alto = hay
  // que scrollear mas para cambiar de banner (subir/bajar para ajustar el ritmo).
  const VH_POR_ESCENA = 175;

  return (
    <section
      ref={ref}
      data-hero
      style={{ position: "relative", height: `${total * VH_POR_ESCENA}vh` }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background:
            "radial-gradient(120% 90% at 78% 20%, #FDF4F3 0%, #FCF9F8 55%, #FBF7F4 100%)",
        }}
      >
        <FormasOrganicas />

        {hero.escenas.map((escena, i) => (
          <EscenaCrossfade
            key={i}
            escena={escena}
            index={i}
            total={total}
            progress={scrollYProgress}
            hero={hero}
            waLink={waLink}
          />
        ))}
      </div>
    </section>
  );
}

function EscenaCrossfade({
  escena,
  index,
  total,
  progress,
  hero,
  waLink,
}: {
  escena: EscenaHero;
  index: number;
  total: number;
  progress: MotionValue<number>;
  hero: SeccionHero;
  waLink: string;
}) {
  const inicio = index / total;
  const fin = (index + 1) / total;

  // Transicion SECUENCIAL (sin solape) para la figura Y el texto: la escena saliente
  // termina de desvanecerse justo cuando entra la siguiente, asi nunca se ven dos
  // escenas encimadas (ni texto doble ni figuras superpuestas). Un leve desplazamiento
  // vertical del texto da sensacion de movimiento. Solo opacity/transform.
  // Nota: cuando lleguen fotos reales (recortes transparentes) se puede reintroducir un
  // leve solape en la figura para un disolvido mas suave; con placeholders opacos NO.
  // Funcion explicita (NO rangos de useTransform): con rangos, la opacidad de la primera
  // escena reaparecia fuera de su ventana al final del hero (clamp ambiguo). Aca clampeo
  // a mano: cada escena vale 0 fuera de [inicio, fin] salvo la primera (visible desde el
  // arranque) y la ultima (queda visible hasta el final). Figura y texto comparten esta
  // opacidad, asi que nunca hay dos escenas encimadas.
  const d = 0.05;
  const opacityEscena = useTransform(progress, (p) => {
    if (index === 0) {
      if (p <= fin - d) return 1;
      if (p >= fin) return 0;
      return 1 - (p - (fin - d)) / d;
    }
    if (index === total - 1) {
      if (p <= inicio) return 0;
      if (p >= inicio + d) return 1;
      return (p - inicio) / d;
    }
    if (p <= inicio) return 0;
    if (p < inicio + d) return (p - inicio) / d;
    if (p <= fin - d) return 1;
    if (p < fin) return 1 - (p - (fin - d)) / d;
    return 0;
  });
  // Leve y-slide del texto: entra desde +24 mientras aparece, sale hacia -24 mientras se va.
  const yTexto = useTransform(progress, (p) => {
    if (index !== 0 && p < inicio + d) {
      const t = p <= inicio ? 0 : (p - inicio) / d;
      return 24 * (1 - t);
    }
    if (index !== total - 1 && p > fin - d) {
      const t = p >= fin ? 1 : (p - (fin - d)) / d;
      return -24 * t;
    }
    return 0;
  });

  return (
    <>
      <motion.div
        style={{ opacity: opacityEscena, position: "absolute", inset: 0, zIndex: 2 }}
        aria-hidden="true"
      >
        <Figura escena={escena} />
      </motion.div>
      <motion.div
        style={{ opacity: opacityEscena, y: yTexto, position: "absolute", inset: 0, zIndex: 3 }}
        aria-hidden={index === 0 ? undefined : true}
      >
        <Texto escena={escena} index={index} total={total} hero={hero} waLink={waLink} />
      </motion.div>
    </>
  );
}

function HeroEstatico({ hero, waLink }: { hero: SeccionHero; waLink: string }) {
  const escena = hero.escenas[0]!;
  return (
    <section
      data-hero
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 78% 20%, #FDF4F3 0%, #FCF9F8 55%, #FBF7F4 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* En mobile la figura va arriba enmarcada para no empastarse con el texto */}
      <FiguraMobile escena={escena} />
      <Texto escena={escena} index={0} total={hero.escenas.length} hero={hero} waLink={waLink} esMobile />
    </section>
  );
}

function FormasOrganicas() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "8%",
          right: "4%",
          width: "clamp(360px,46vw,660px)",
          height: "clamp(360px,46vw,660px)",
          borderRadius: "47% 53% 44% 56% / 52% 45% 55% 48%",
          background:
            "radial-gradient(circle at 42% 36%, #F7DCE0 0%, #F3D9DD 52%, rgba(243,217,221,0) 74%)",
          filter: "blur(2px)",
          animation: "flotarBlob 14s ease-in-out infinite",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          right: "30%",
          width: "clamp(80px,9vw,140px)",
          height: "clamp(80px,9vw,140px)",
          borderRadius: "50%",
          border: "1px solid rgba(217,139,160,.45)",
          zIndex: 1,
        }}
      />
    </>
  );
}

function Figura({ escena }: { escena: EscenaHero }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={escena.imagen.url}
        alt={escena.imagen.textoAlternativo}
        style={{
          position: "absolute",
          bottom: 0,
          right: "clamp(-40px,2vw,3vw)",
          height: "min(90vh,820px)",
          width: "auto",
          filter: "drop-shadow(0 34px 44px rgba(110,75,58,.24))",
        }}
      />
    </div>
  );
}

/* Figura de mobile: va arriba enmarcada en un contenedor rosado. */
function FiguraMobile({ escena }: { escena: EscenaHero }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxHeight: "45vh",
        overflow: "hidden",
        background: "linear-gradient(160deg,#F7DCE0 0%,#F3D9DD 100%)",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={escena.imagen.url}
        alt={escena.imagen.textoAlternativo}
        style={{
          display: "block",
          margin: "0 auto",
          height: "45vh",
          width: "auto",
          objectFit: "contain",
          objectPosition: "bottom center",
          filter: "drop-shadow(0 20px 28px rgba(110,75,58,.22))",
        }}
      />
    </div>
  );
}

function Texto({
  escena,
  index,
  total,
  hero,
  waLink,
  esMobile = false,
}: {
  escena: EscenaHero;
  index: number;
  total: number;
  hero: SeccionHero;
  waLink: string;
  esMobile?: boolean;
}) {
  /* Estilos del titulo: identicos en ambos tags para mantener la misma presentacion visual */
  const estiloTitulo = {
    fontWeight: 500,
    fontSize: "clamp(42px,8vw,86px)",
    lineHeight: 1.0,
    letterSpacing: "-.01em",
    margin: "0 0 18px",
    color: "var(--texto)",
  } as const;

  const lineaTitulo = escena.titulo.split("\n").map((linea, i, arr) => (
    <span key={i}>
      {linea}
      {i < arr.length - 1 && <br />}
    </span>
  ));

  return (
    <div
      style={{
        position: esMobile ? "relative" : "absolute",
        inset: esMobile ? undefined : 0,
        zIndex: 3,
        display: "flex",
        alignItems: esMobile ? "flex-start" : "center",
        pointerEvents: "none",
        flex: esMobile ? "1 1 auto" : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1220,
          margin: "0 auto",
          padding: esMobile ? "clamp(24px,5vw,40px) clamp(20px,5vw,64px)" : "0 clamp(20px,5vw,64px)",
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth: esMobile ? "100%" : "min(86vw,560px)",
            padding: "clamp(20px,3vw,32px)",
            borderRadius: "var(--radio-lg)",
            background: esMobile
              ? "rgba(252,249,248,.96)"
              : "radial-gradient(120% 120% at 0% 0%, rgba(252,249,248,.9) 0%, rgba(252,249,248,.55) 60%, rgba(252,249,248,0) 100%)",
            boxShadow: esMobile ? "0 4px 24px rgba(110,75,58,.08)" : undefined,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: ".02em",
              color: "var(--acento-texto)",
              marginBottom: 18,
            }}
          >
            {escena.etiqueta}
          </div>

          {/* Solo la escena 0 renderiza <h1>; las demas usan <p> con identico estilo visual */}
          {index === 0 ? (
            <h1 className="serif" style={estiloTitulo}>
              {lineaTitulo}
            </h1>
          ) : (
            <p className="serif" style={estiloTitulo}>
              {lineaTitulo}
            </p>
          )}

          <p
            style={{
              margin: 0,
              fontSize: "clamp(16px,1.7vw,19px)",
              lineHeight: 1.7,
              color: "var(--marron)",
              maxWidth: 460,
            }}
          >
            {escena.copete}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: "clamp(24px,4vh,40px)",
              pointerEvents: "auto",
            }}
          >
            <a
              href={waLink}
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "var(--acento)",
                color: "#fff",
                padding: "15px 28px",
                borderRadius: "var(--radio-pill)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "var(--sombra-acento)",
              }}
            >
              <Icono nombre="whatsapp-logo" size={19} color="#fff" />
              {hero.ctaPrimario}
            </a>
            <a
              href="#pilares"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                color: "var(--marron)",
                padding: "15px 24px",
                borderRadius: "var(--radio-pill)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                border: "1px solid #E7D8D2",
                background: "rgba(255,255,255,.5)",
              }}
            >
              {hero.ctaSecundario}
            </a>
          </div>

          {/* Puntitos decorativos: solo en crossfade de desktop (total > 1 y no mobile) */}
          {!esMobile && (
            <div
              style={{ display: "flex", gap: 10, marginTop: "clamp(26px,4vh,40px)" }}
              aria-hidden="true"
            >
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 30,
                    height: 6,
                    borderRadius: "var(--radio-pill)",
                    background: i === index ? "var(--acento)" : "rgba(110,75,58,.22)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

