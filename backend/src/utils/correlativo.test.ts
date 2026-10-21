import { describe, expect, it } from "vitest";
import { siguienteCorrelativo } from "./correlativo";

describe("siguienteCorrelativo", () => {
  it("vuelve a 001 si no queda ningún recibo del año", () => {
    expect(siguienteCorrelativo(null, 2026)).toEqual({
      secuencia: 1,
      numeroRecibo: "001",
      anioRecibo: 2026,
    });
    expect(siguienteCorrelativo(undefined, 2026).numeroRecibo).toBe("001");
    expect(siguienteCorrelativo(0, 2026).numeroRecibo).toBe("001");
  });

  it("continúa después del mayor recibo restante sin renumerar", () => {
    expect(siguienteCorrelativo(3, 2026)).toEqual({
      secuencia: 4,
      numeroRecibo: "004",
      anioRecibo: 2026,
    });
    expect(siguienteCorrelativo(12, 2026).numeroRecibo).toBe("013");
  });
});
