"use client";

import { useState, type FormEvent } from "react";
import type { SeccionContacto } from "@axs/cms-client";
import { Icono } from "./Icono";

const ESTILO_INPUT = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #EAD9D2",
  borderRadius: "var(--radio-sm)",
  fontFamily: "inherit",
  fontSize: 15,
  color: "var(--texto)",
  background: "#FDFAF9",
  outline: "none",
} as const;

const ESTILO_LABEL = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--marron-claro)",
  marginBottom: 8,
} as const;

export function Contacto({ contacto, waLink }: { contacto: SeccionContacto; waLink: string }) {
  const [enviado, setEnviado] = useState(false);

  // v1: el envio confirma en pantalla. La integracion real (email/WhatsApp/CRM)
  // se cablea cuando el CMS exponga el endpoint de contacto.
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviado(true);
  }

  return (
    <section
      id="contacto"
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "linear-gradient(180deg,#FCEDED 0%,#FBE7EA 100%)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <h2
          className="serif"
          style={{
            fontWeight: 500,
            fontSize: "clamp(32px,5.2vw,62px)",
            lineHeight: 1.03,
            letterSpacing: "-.01em",
            margin: "0 0 18px",
            color: "var(--texto)",
          }}
        >
          {contacto.titulo}
        </h2>
        <p
          style={{
            margin: "0 auto clamp(40px,5vw,52px)",
            fontSize: "clamp(16px,1.6vw,18px)",
            lineHeight: 1.7,
            color: "var(--marron)",
            maxWidth: 520,
          }}
        >
          {contacto.descripcion}
        </p>

        {enviado ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 22,
              padding: "clamp(40px,5vw,60px)",
              boxShadow: "0 30px 70px -40px rgba(110,75,58,.5)",
            }}
          >
            <Icono nombre="heart-straight" size={44} />
            <p className="serif" style={{ fontSize: "clamp(24px,3vw,34px)", color: "var(--texto)", margin: "18px 0 8px" }}>
              Gracias, te leo pronto
            </p>
            <p style={{ margin: 0, fontSize: 15, color: "var(--marron)" }}>
              Te respondo en cuanto pueda. Si es urgente,{" "}
              <a href={waLink} target="_blank" rel="noopener" style={{ color: "var(--acento-texto)", fontWeight: 600 }}>
                escribime directo por WhatsApp
              </a>
              .
            </p>
          </div>
        ) : (
          <form
            onSubmit={enviar}
            style={{
              textAlign: "left",
              background: "#fff",
              borderRadius: 22,
              padding: "clamp(28px,4vw,44px)",
              boxShadow: "0 30px 70px -40px rgba(110,75,58,.5)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <label style={{ display: "block" }}>
                <span style={ESTILO_LABEL}>Tu nombre</span>
                <input type="text" name="nombre" required style={ESTILO_INPUT} />
              </label>
              <label style={{ display: "block" }}>
                <span style={ESTILO_LABEL}>WhatsApp o email</span>
                <input type="text" name="contacto" required style={ESTILO_INPUT} />
              </label>
            </div>
            <label style={{ display: "block", marginBottom: 24 }}>
              <span style={ESTILO_LABEL}>Contame un poco</span>
              <textarea name="mensaje" rows={4} style={{ ...ESTILO_INPUT, resize: "vertical" }} />
            </label>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: "var(--acento)",
                color: "#fff",
                padding: 16,
                borderRadius: "var(--radio-pill)",
                fontWeight: 600,
                fontSize: 15.5,
                border: "none",
                cursor: "pointer",
                boxShadow: "var(--sombra-acento)",
              }}
            >
              Enviar mensaje
              <Icono nombre="arrow-right" size={18} color="#fff" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
