import { Icono } from "./Icono";

export function Header({ nombre, waLink }: { nombre: string; waLink: string }) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "clamp(14px,2vw,22px) clamp(20px,5vw,64px)",
      }}
    >
      <a
        href="#top"
        className="serif"
        style={{
          fontWeight: 500,
          fontSize: "clamp(22px,2.4vw,28px)",
          letterSpacing: ".01em",
          color: "var(--texto)",
          textDecoration: "none",
          lineHeight: 1,
        }}
      >
        {nombre}
      </a>
      <a
        href={waLink}
        target="_blank"
        rel="noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          background: "var(--acento)",
          color: "#fff",
          padding: "14px 20px",
          borderRadius: "var(--radio-pill)",
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          boxShadow: "var(--sombra-acento)",
        }}
      >
        <Icono nombre="whatsapp-logo" size={18} color="#fff" />
        <span>Charlemos</span>
      </a>
    </header>
  );
}
