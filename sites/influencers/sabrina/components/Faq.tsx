"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SeccionFaq } from "@axs/cms-client";
import { Icono } from "./Icono";

export function Faq({ faq }: { faq: SeccionFaq }) {
  const [abierta, setAbierta] = useState(-1);
  const reducido = useReducedMotion();

  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(80px,12vw,150px) clamp(20px,5vw,64px)",
        background: "var(--fondo)",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h2
          className="serif"
          style={{
            fontWeight: 500,
            fontSize: "clamp(30px,4.8vw,56px)",
            lineHeight: 1.04,
            letterSpacing: "-.01em",
            margin: "0 0 clamp(36px,5vw,52px)",
            color: "var(--texto)",
          }}
        >
          {faq.titulo}
        </h2>

        <div>
          {faq.items.map((item, i) => {
            const esta = abierta === i;
            return (
              <div key={i} style={{ borderTop: "1px solid var(--borde-tenue)" }}>
                <button
                  onClick={() => setAbierta(esta ? -1 : i)}
                  aria-expanded={esta}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 20,
                    background: "none",
                    border: "none",
                    padding: "clamp(22px,2.6vw,28px) 0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    className="serif"
                    style={{ fontWeight: 500, fontSize: "clamp(20px,2.4vw,27px)", color: "var(--texto)", lineHeight: 1.2 }}
                  >
                    {item.pregunta}
                  </span>
                  <Icono nombre={esta ? "minus" : "plus"} size={24} style={{ flex: "0 0 auto" }} />
                </button>

                <AnimatePresence initial={false}>
                  {esta && (
                    <motion.div
                      key="resp"
                      initial={reducido ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reducido ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 0 clamp(24px,3vw,30px)", maxWidth: 640 }}>
                        <p style={{ margin: 0, fontSize: "clamp(15px,1.5vw,17px)", lineHeight: 1.75, color: "var(--marron)" }}>
                          {item.respuesta}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid var(--borde-tenue)" }} />
        </div>
      </div>
    </section>
  );
}
