import "reflect-metadata";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, PDFPage } from "pdf-lib";
import { PdfService, type ReciboPdfData } from "./pdf.service";

vi.mock("../config/env", () => ({ env: { pdfSignP12Path: "" } }));
afterEach(() => vi.restoreAllMocks());

describe("descripción del recibo PDF", () => {
  it.each([
    "Observación del tesorero: pago recibido en oficina.",
    "Observación de tesorería con detalles del pago. ".repeat(15).slice(0, 500),
    "W".repeat(500),
  ])("ajusta el texto sin invadir el total ni la firma (%#)", async (descripcionPago) => {
    const text = vi.spyOn(PDFPage.prototype, "drawText");
    const rectangles = vi.spyOn(PDFPage.prototype, "drawRectangle");
    const data = {
      recibo: { numeroRecibo: "2026-001", tipoCobro: "tarifa_anual", fechaPago: "2026-10-18", lugarPago: "Aldea Sibaná", descripcionPago, totalPagado: "240", cantidadEnLetras: "Doscientos cuarenta quetzales" },
      usuario: { nombreCompleto: "Beneficiario de prueba", dpi: "9902600000001" },
      vivienda: { direccion: "Sector de prueba" }, tesorero: { nombre: "Tesorero de prueba" },
      detalleLineas: ["Tarifa anual 2026: Q 240.00"],
    } as ReciboPdfData;
    const bytes = await new PdfService().generarRecibo(data);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    const start = text.mock.calls.findIndex(([value]) => value === "Descripcion:");
    const end = text.mock.calls.findIndex(([value]) => value.startsWith("Total pagado:"));
    const lines = text.mock.calls.slice(start + 1, end);
    expect(lines.map(([value]) => value).join(" ").replace(/\s/g, "")).toBe(descripcionPago.replace(/\s/g, ""));
    const totalBox = rectangles.mock.calls.at(-1)?.[0];
    expect(totalBox).toBeDefined();
    for (const [value, options] of lines) {
      expect(options!.font!.widthOfTextAtSize(value, 10)).toBeLessThanOrEqual(500);
      expect(options!.y).toBeGreaterThan(totalBox!.y! + totalBox!.height! + 5);
    }
    const signature = text.mock.calls.slice(end).find(([value]) => value === "Tesorero de prueba");
    expect(signature?.[1]?.y).toBeGreaterThan(60);
  });
});
