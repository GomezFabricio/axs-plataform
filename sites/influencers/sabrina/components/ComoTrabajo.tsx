import type { SeccionComoTrabajo } from "@axs/cms-client";
import { Reveal } from "./Reveal";

export function ComoTrabajo({ comoTrabajo }: { comoTrabajo: SeccionComoTrabajo }) {
  const ultimo = comoTrabajo.pasos.length - 1;
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "var(--fondo)",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Reveal style={{ maxWidth: 620, marginBottom: "clamp(40px,6vw,60px)" }}>
          <h2
            className="serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px,4.6vw,54px)",
              lineHeight: 1.05,
              letterSpacing: "-.01em",
              margin: 0,
              color: "var(--texto)",
            }}
          >
            {comoTrabajo.titulo}
          </h2>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {comoTrabajo.pasos.map((paso, i) => (
            <Reveal
              key={i}
              style={{
                display: "flex",
                gap: "clamp(20px,4vw,48px)",
                alignItems: "flex-start",
                padding: "clamp(26px,3vw,38px) 0",
                borderTop: "1px solid var(--borde-tenue)",
                borderBottom: i === ultimo ? "1px solid var(--borde-tenue)" : undefined,
              }}
            >
              <div
                className="serif"
                style={{ fontSize: "clamp(34px,4vw,52px)", color: "var(--acento)", lineHeight: 1, flex: "0 0 auto", minWidth: 48 }}
              >
                {paso.numero}
              </div>
              <div>
                <h3
                  className="serif"
                  style={{ fontWeight: 600, fontSize: "clamp(22px,2.6vw,30px)", margin: "0 0 10px", color: "var(--texto)" }}
                >
                  {paso.titulo}
                </h3>
                <p style={{ margin: 0, fontSize: "clamp(15px,1.5vw,17px)", lineHeight: 1.7, color: "var(--marron)", maxWidth: 560 }}>
                  {paso.descripcion}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
