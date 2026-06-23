import type { Pilar, SeccionPilares } from "@axs/cms-client";
import { Reveal } from "./Reveal";
import { Icono } from "./Icono";

const ESTILO_CARD = {
  background: "#fff",
  borderRadius: "var(--radio-md)",
  boxShadow: "var(--sombra-card)",
} as const;

export function Pilares({ pilares }: { pilares: SeccionPilares }) {
  const grande = pilares.pilares.find((p) => p.variante === "grande");
  const compactos = pilares.pilares.filter((p) => p.variante === "compacto");
  const banda = pilares.pilares.find((p) => p.variante === "banda");

  return (
    <section
      id="pilares"
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "var(--fondo)",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <Reveal style={{ maxWidth: 640, marginBottom: "clamp(40px,6vw,64px)" }}>
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
            {pilares.titulo}
          </h2>
          <p style={{ margin: 0, fontSize: "clamp(16px,1.5vw,18px)", lineHeight: 1.7, color: "var(--marron-claro)" }}>
            {pilares.copete}
          </p>
        </Reveal>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {grande && <PilarGrande pilar={grande} />}

          {compactos.length > 0 && (
            <div style={{ flex: "1 1 280px", minWidth: 240, display: "flex", flexDirection: "column", gap: 20 }}>
              {compactos.map((pilar, i) => (
                <PilarCompacto key={i} pilar={pilar} />
              ))}
            </div>
          )}

          {banda && <PilarBanda pilar={banda} />}
        </div>
      </div>
    </section>
  );
}

function PilarGrande({ pilar }: { pilar: Pilar }) {
  return (
    <Reveal
      style={{
        ...ESTILO_CARD,
        flex: "2 1 420px",
        minWidth: 300,
        padding: "clamp(28px,3.4vw,44px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 30,
      }}
    >
      <div>
        <Icono nombre={pilar.icono} size={34} />
        <h3
          className="serif"
          style={{ fontWeight: 600, fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.1, margin: "20px 0 12px", color: "var(--texto)" }}
        >
          {pilar.titulo}
        </h3>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "var(--marron)", maxWidth: 420 }}>
          {pilar.descripcion}
        </p>
      </div>
      {pilar.nota && (
        <div className="serif" style={{ fontStyle: "italic", fontSize: "clamp(20px,2.2vw,26px)", color: "var(--acento)" }}>
          {pilar.nota}
        </div>
      )}
    </Reveal>
  );
}

function PilarCompacto({ pilar }: { pilar: Pilar }) {
  return (
    <Reveal style={{ ...ESTILO_CARD, padding: "clamp(24px,2.6vw,32px)", flex: 1 }}>
      <Icono nombre={pilar.icono} size={30} />
      <h3
        className="serif"
        style={{ fontWeight: 600, fontSize: "clamp(22px,2.4vw,28px)", margin: "16px 0 10px", color: "var(--texto)" }}
      >
        {pilar.titulo}
      </h3>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--marron)" }}>{pilar.descripcion}</p>
    </Reveal>
  );
}

function PilarBanda({ pilar }: { pilar: Pilar }) {
  return (
    <Reveal
      style={{
        flex: "1 1 100%",
        background: "linear-gradient(110deg,#6E4B3A 0%,#8C6A55 100%)",
        borderRadius: "var(--radio-md)",
        padding: "clamp(30px,4vw,52px)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 24,
        justifyContent: "space-between",
        boxShadow: "0 28px 60px -34px rgba(110,75,58,.6)",
      }}
    >
      <div style={{ flex: "1 1 320px" }}>
        <Icono nombre={pilar.icono} size={34} color="#F3D9DD" />
        <h3
          className="serif"
          style={{ fontWeight: 500, fontSize: "clamp(28px,3.6vw,46px)", lineHeight: 1.05, margin: "18px 0 12px", color: "#FCF1F1" }}
        >
          {pilar.titulo}
        </h3>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#EBD9CF", maxWidth: 520 }}>{pilar.descripcion}</p>
      </div>
      {pilar.nota && (
        <div
          className="serif"
          style={{ fontStyle: "italic", fontSize: "clamp(22px,2.6vw,30px)", color: "#F3D9DD", flex: "0 0 auto" }}
        >
          {pilar.nota}
        </div>
      )}
    </Reveal>
  );
}
