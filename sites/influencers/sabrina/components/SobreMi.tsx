import type { SeccionSobreMi } from "@axs/cms-client";
import { Reveal } from "./Reveal";

export function SobreMi({ sobreMi }: { sobreMi: SeccionSobreMi }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "var(--fondo)",
      }}
    >
      <div
        className="sobremi"
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(36px,6vw,84px)",
          alignItems: "center",
        }}
      >
        <Reveal className="sobremi-figura" style={{ flex: "1 1 320px", position: "relative", minWidth: 280 }}>
          <div
            style={{
              position: "relative",
              borderRadius: "var(--radio-lg)",
              background: "linear-gradient(170deg,#FBE7EA 0%,#F6EDE8 100%)",
              paddingTop: 18,
              overflow: "hidden",
              boxShadow: "var(--sombra-figura)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 24,
                width: 74,
                height: 74,
                borderRadius: "50%",
                border: "1px solid rgba(217,139,160,.5)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sobreMi.imagen.url}
              alt={sobreMi.imagen.textoAlternativo}
              style={{
                position: "relative",
                width: "100%",
                height: "auto",
                filter: "drop-shadow(0 18px 26px rgba(110,75,58,.18))",
              }}
            />
          </div>
        </Reveal>

        <Reveal style={{ flex: "1 1 360px", minWidth: 300 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--acento-texto)", marginBottom: 18 }}>
            {sobreMi.copete}
          </div>
          <h2
            className="serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px,4.4vw,52px)",
              lineHeight: 1.06,
              letterSpacing: "-.01em",
              margin: "0 0 26px",
              color: "var(--texto)",
            }}
          >
            {sobreMi.titulo}
          </h2>
          {sobreMi.parrafos.map((parrafo, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? "0 0 18px" : 0,
                fontSize: "clamp(16px,1.5vw,18px)",
                lineHeight: 1.78,
                color: "var(--marron)",
              }}
            >
              {parrafo}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
