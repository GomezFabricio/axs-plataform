import { describe, expect, it } from "vitest";
import { consultarRateLimit } from "@/lib/rateLimit";

/** Cada test usa su propia clave: el estado del limitador es global al proceso. */
describe("consultarRateLimit", () => {
  it("permite 60 peticiones en la ventana y rechaza la 61", () => {
    for (let i = 1; i <= 60; i++) {
      expect(consultarRateLimit("ip-a", 1_000)).toMatchObject({ permitido: true, restantes: 60 - i });
    }
    expect(consultarRateLimit("ip-a", 1_000)).toEqual({ permitido: false, restantes: 0, reiniciaEn: 61_000 });
  });

  it("abre una ventana nueva a los 60 segundos", () => {
    for (let i = 0; i < 61; i++) consultarRateLimit("ip-b", 1_000);
    expect(consultarRateLimit("ip-b", 60_999).permitido).toBe(false);
    expect(consultarRateLimit("ip-b", 61_000)).toMatchObject({ permitido: true, restantes: 59 });
  });

  it("cuenta cada clave por separado", () => {
    for (let i = 0; i < 60; i++) consultarRateLimit("ip-c", 1_000);
    expect(consultarRateLimit("ip-d", 1_000).permitido).toBe(true);
  });
});
