import type { SeccionProposito } from "@axs/cms-client";
import { Reveal } from "./Reveal";
import { Icono } from "./Icono";

export function Proposito({ proposito }: { proposito: SeccionProposito }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(70px,10vw,140px) clamp(20px,5vw,64px)",
        background: "linear-gradient(180deg,#FBEFF0 0%,#FCEDED 100%)",
      }}
    >
      <Reveal style={{ maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
        <Icono
          nombre={proposito.icono}
          size={48}
          style={{ marginBottom: 24, display: "inline-block" }}
        />
        <p
          className="serif"
          style={{
            fontWeight: 500,
            fontSize: "clamp(30px,5.2vw,62px)",
            lineHeight: 1.14,
            letterSpacing: "-.01em",
            margin: 0,
            color: "var(--texto)",
            textWrap: "balance",
          }}
        >
          {proposito.texto}
        </p>
      </Reveal>
    </section>
  );
}
