import { Icono } from "./Icono";

export function WhatsappFlotante({ waLink }: { waLink: string }) {
  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener"
      aria-label="Escribir por WhatsApp"
      style={{
        position: "fixed",
        zIndex: 60,
        right: "clamp(16px,3vw,28px)",
        bottom: "clamp(16px,3vw,28px)",
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: "var(--acento)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        boxShadow: "0 16px 34px -10px rgba(217,139,160,.9)",
      }}
    >
      <Icono nombre="whatsapp-logo" peso="fill" size={28} color="#fff" />
    </a>
  );
}
