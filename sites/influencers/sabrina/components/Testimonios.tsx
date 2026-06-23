import type { SeccionTestimonios, Testimonio } from "@axs/cms-client";
import { Reveal } from "./Reveal";
import { Icono } from "./Icono";

export function Testimonios({ testimonios }: { testimonios: SeccionTestimonios }) {
  const destacado = testimonios.testimonios.find((t) => t.destacado);
  const resto = testimonios.testimonios.filter((t) => !t.destacado);

  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "var(--fondo)",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <Reveal style={{ marginBottom: "clamp(40px,6vw,60px)", maxWidth: 560 }}>
          <h2
            className="serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px,4.8vw,56px)",
              lineHeight: 1.04,
              letterSpacing: "-.01em",
              margin: 0,
              color: "var(--texto)",
            }}
          >
            {testimonios.titulo}
          </h2>
        </Reveal>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 22 }}>
          {destacado && <TestimonioDestacado testimonio={destacado} />}

          {resto.length > 0 && (
            <div style={{ flex: "1 1 280px", minWidth: 240, display: "flex", flexDirection: "column", gap: 22 }}>
              {resto.map((testimonio, i) => (
                <TestimonioSimple key={i} testimonio={testimonio} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonioDestacado({ testimonio }: { testimonio: Testimonio }) {
  return (
    <Reveal
      as="div"
      style={{
        flex: "2 1 420px",
        minWidth: 300,
        margin: 0,
        background: "linear-gradient(160deg,#FBE9EC 0%,#FBF2EE 100%)",
        borderRadius: 20,
        padding: "clamp(30px,3.6vw,48px)",
        boxShadow: "0 26px 58px -38px rgba(110,75,58,.45)",
      }}
    >
      <blockquote style={{ margin: 0 }}>
        <Icono nombre="quotes" peso="fill" size={38} style={{ opacity: 0.55 }} />
        <p
          className="serif"
          style={{ fontSize: "clamp(24px,3vw,38px)", lineHeight: 1.28, color: "var(--texto)", margin: "14px 0 26px", fontWeight: 500 }}
        >
          {testimonio.cita}
        </p>
        <footer style={{ fontSize: 15, color: "var(--marron)" }}>
          <strong style={{ fontWeight: 700 }}>{testimonio.nombre}</strong>, {testimonio.rol}
        </footer>
      </blockquote>
    </Reveal>
  );
}

function TestimonioSimple({ testimonio }: { testimonio: Testimonio }) {
  return (
    <Reveal
      as="div"
      style={{
        margin: 0,
        background: "#fff",
        borderRadius: 20,
        padding: "clamp(26px,2.8vw,34px)",
        boxShadow: "0 22px 50px -36px rgba(110,75,58,.4)",
        flex: 1,
      }}
    >
      <blockquote style={{ margin: 0 }}>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#3A2E27", margin: "0 0 18px" }}>{testimonio.cita}</p>
        <footer style={{ fontSize: 14, color: "var(--marron)" }}>
          <strong style={{ fontWeight: 700 }}>{testimonio.nombre}</strong>, {testimonio.rol}
        </footer>
      </blockquote>
    </Reveal>
  );
}
