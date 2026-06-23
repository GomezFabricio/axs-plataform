import type { SeccionExperiencias } from "@axs/cms-client";
import { Reveal } from "./Reveal";
import { Icono } from "./Icono";

export function Experiencias({ experiencias }: { experiencias: SeccionExperiencias }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "linear-gradient(180deg,#FBF4F2 0%,#FCEDED 100%)",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <Reveal style={{ maxWidth: 640, marginBottom: "clamp(40px,6vw,60px)" }}>
          <h2
            className="serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px,4.8vw,56px)",
              lineHeight: 1.04,
              letterSpacing: "-.01em",
              margin: "0 0 18px",
              color: "var(--texto)",
            }}
          >
            {experiencias.titulo}
          </h2>
          <p style={{ margin: 0, fontSize: "clamp(16px,1.5vw,18px)", lineHeight: 1.7, color: "var(--marron-claro)" }}>
            {experiencias.copete}
          </p>
        </Reveal>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {experiencias.experiencias.map((exp, i) => (
            <Reveal key={i} as="figure" style={{ flex: "1 1 380px", minWidth: 280, margin: 0 }}>
              <div style={{ borderRadius: "var(--radio-md)", overflow: "hidden", boxShadow: "0 28px 60px -36px rgba(110,75,58,.5)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exp.imagen.url}
                  alt={exp.imagen.textoAlternativo}
                  style={{ width: "100%", height: "clamp(240px,32vw,380px)", objectFit: "cover" }}
                />
              </div>
              <figcaption style={{ marginTop: 18 }}>
                <div className="serif" style={{ fontSize: "clamp(22px,2.4vw,28px)", color: "var(--texto)" }}>{exp.titulo}</div>
                <div style={{ fontSize: 14.5, color: "var(--marron-claro)", marginTop: 4 }}>{exp.descripcion}</div>
              </figcaption>
            </Reveal>
          ))}
        </div>

        <Reveal style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 30, alignItems: "center" }}>
          <span style={{ fontSize: 14.5, color: "var(--marron-claro)" }}>También organizo</span>
          {experiencias.tambienOrganizo.map((etiqueta, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "#fff",
                border: "1px solid #F0E0DA",
                borderRadius: "var(--radio-pill)",
                padding: "10px 20px",
                fontSize: 14.5,
                color: "#3A2E27",
              }}
            >
              <Icono nombre={etiqueta.icono} size={18} />
              {etiqueta.texto}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
