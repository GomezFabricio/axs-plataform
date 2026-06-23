import type { SeccionPack } from "@axs/cms-client";
import { Reveal } from "./Reveal";
import { Icono } from "./Icono";

export function Pack({ pack }: { pack: SeccionPack }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "linear-gradient(180deg,#FCF9F8 0%,#FBF4F2 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(36px,5vw,72px)",
          alignItems: "center",
        }}
      >
        <Reveal style={{ flex: "1 1 320px", minWidth: 280, order: 2 }}>
          <div
            style={{
              position: "relative",
              borderRadius: "var(--radio-lg)",
              background: "linear-gradient(160deg,#F6E7DE 0%,#FBEFE9 100%)",
              overflow: "hidden",
              boxShadow: "var(--sombra-figura)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pack.imagen.url}
              alt={pack.imagen.textoAlternativo}
              style={{ width: "100%", height: "auto", filter: "drop-shadow(0 16px 22px rgba(110,75,58,.16))" }}
            />
          </div>
        </Reveal>

        <Reveal style={{ flex: "1 1 400px", minWidth: 300 }}>
          <h2
            className="serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px,4.4vw,52px)",
              lineHeight: 1.05,
              letterSpacing: "-.01em",
              margin: "0 0 18px",
              color: "var(--texto)",
            }}
          >
            {pack.titulo}
          </h2>
          <p style={{ margin: "0 0 30px", fontSize: "clamp(16px,1.5vw,18px)", lineHeight: 1.7, color: "var(--marron)", maxWidth: 480 }}>
            {pack.descripcion}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: "14px 28px",
              marginBottom: 34,
            }}
          >
            {pack.incluye.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icono nombre="check" size={20} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 15.5, lineHeight: 1.5, color: "#3A2E27" }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ borderLeft: "2px solid var(--acento)", paddingLeft: 22 }}>
            <p
              className="serif"
              style={{ margin: 0, fontStyle: "italic", fontSize: "clamp(22px,2.6vw,30px)", lineHeight: 1.25, color: "var(--texto)" }}
            >
              {pack.cita}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
