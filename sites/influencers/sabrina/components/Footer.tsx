import type { SeccionRedes } from "@axs/cms-client";
import { Icono } from "./Icono";

export function Footer({ redes }: { redes: SeccionRedes }) {
  return (
    <footer
      style={{
        position: "relative",
        padding: "clamp(64px,9vw,110px) clamp(20px,5vw,64px) clamp(48px,6vw,72px)",
        background: "var(--texto)",
        color: "var(--acento-suave)",
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 40,
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div className="serif" style={{ fontWeight: 500, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.05, color: "#FCF1F1", marginBottom: 14 }}>
            {redes.nombre}
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#C9A99B", maxWidth: 340 }}>{redes.descripcion}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {redes.redes.map((red, i) => (
            <a
              key={i}
              href={red.url}
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: "var(--radio-pill)",
                border: "1px solid rgba(243,217,221,.3)",
                color: "var(--acento-suave)",
                textDecoration: "none",
                fontSize: 14.5,
              }}
            >
              <Icono nombre={red.icono} size={20} color="var(--acento-suave)" />
              {red.etiqueta}
            </a>
          ))}
        </div>
      </div>
      <div
        style={{
          maxWidth: 1160,
          margin: "clamp(40px,6vw,60px) auto 0",
          paddingTop: 26,
          borderTop: "1px solid rgba(243,217,221,.16)",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "space-between",
          fontSize: 13,
          color: "#A8897C",
        }}
      >
        <span>{redes.ubicacion}</span>
        <span>{redes.nota}</span>
      </div>
    </footer>
  );
}
