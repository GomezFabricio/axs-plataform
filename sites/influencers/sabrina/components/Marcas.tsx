import type { SeccionMarcas } from "@axs/cms-client";
import { Reveal } from "./Reveal";

export function Marcas({ marcas }: { marcas: SeccionMarcas }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(64px,9vw,110px) clamp(20px,5vw,64px)",
        background: "#FBF4F2",
        borderTop: "1px solid #F2E7E2",
        borderBottom: "1px solid #F2E7E2",
      }}
    >
      <Reveal style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--marron)", margin: "0 0 clamp(28px,4vw,44px)", letterSpacing: ".01em" }}>
          {marcas.copete}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(28px,5vw,64px)", alignItems: "center", justifyContent: "center" }}>
          {marcas.marcas.map((marca, i) => (
            <span
              key={i}
              className="serif"
              style={{ fontSize: "clamp(22px,2.6vw,30px)", color: "var(--marron-claro)", opacity: 0.75 }}
            >
              {marca}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
