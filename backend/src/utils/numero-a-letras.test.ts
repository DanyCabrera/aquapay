import { describe, expect, it } from "vitest";
import { numeroALetras } from "./numero-a-letras";

describe("numeroALetras", () => {
  it("convierte montos simples", () => {
    expect(numeroALetras(1)).toContain("un quetzal");
    expect(numeroALetras(120)).toContain("ciento veinte quetzales");
  });
});
