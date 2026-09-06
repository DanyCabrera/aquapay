import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { env } from "../config/env";
import { Recibo } from "../entities/Recibo";
import { UsuarioComunidad } from "../entities/UsuarioComunidad";
import { Vivienda } from "../entities/Vivienda";
import { Perfil } from "../entities/Perfil";

export interface ReciboPdfData {
  recibo: Recibo;
  usuario: UsuarioComunidad;
  vivienda: Vivienda;
  tesorero: Perfil;
  detalleLineas: string[];
}

export class PdfService {
  async generarRecibo(data: ReciboPdfData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const azul = rgb(0.04, 0.43, 0.6);
    const gris = rgb(0.25, 0.3, 0.35);
    const negro = rgb(0.1, 0.1, 0.1);

    let y = 740;

    page.drawRectangle({
      x: 40,
      y: 700,
      width: 532,
      height: 60,
      color: rgb(0.91, 0.96, 0.97),
    });

    page.drawText("COMITE DE AGUA POTABLE", {
      x: 56,
      y: 740,
      size: 14,
      font: fontBold,
      color: azul,
    });
    page.drawText("Aldea Sibana, El Asintal, Retalhuleu", {
      x: 56,
      y: 722,
      size: 10,
      font,
      color: gris,
    });
    page.drawText("RECIBO DE PAGO", {
      x: 400,
      y: 740,
      size: 12,
      font: fontBold,
      color: azul,
    });
    page.drawText(`No. ${data.recibo.numeroRecibo}`, {
      x: 400,
      y: 722,
      size: 14,
      font: fontBold,
      color: negro,
    });

    y = 660;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: 56, y, size: 10, font: fontBold, color: gris });
      page.drawText(value, { x: 180, y, size: 10, font, color: negro });
      y -= 18;
    };

    line("Usuario:", data.usuario.nombreCompleto);
    line("DPI:", data.usuario.dpi);
    line("Vivienda:", data.vivienda.direccion);
    line("Tipo de cobro:", data.recibo.tipoCobro === "tarifa_anual" ? "Tarifa anual" : "Compra de chorro");
    line("Fecha de pago:", data.recibo.fechaPago);
    line("Lugar de pago:", data.recibo.lugarPago);
    line("Tesorero:", data.tesorero.nombre);

    y -= 10;
    page.drawText("Detalle del cobro", {
      x: 56,
      y,
      size: 11,
      font: fontBold,
      color: azul,
    });
    y -= 20;

    for (const linea of data.detalleLineas) {
      page.drawText(`• ${linea}`, {
        x: 64,
        y,
        size: 10,
        font,
        color: negro,
        maxWidth: 480,
      });
      y -= 16;
    }

    y -= 12;
    page.drawText("Descripcion:", {
      x: 56,
      y,
      size: 10,
      font: fontBold,
      color: gris,
    });
    y -= 16;
    page.drawText(data.recibo.descripcionPago, {
      x: 56,
      y,
      size: 10,
      font,
      color: negro,
      maxWidth: 500,
    });

    y -= 40;
    page.drawRectangle({
      x: 40,
      y: y - 20,
      width: 532,
      height: 50,
      color: rgb(0.95, 0.98, 0.97),
      borderColor: azul,
      borderWidth: 1,
    });

    page.drawText(`Total pagado: Q ${Number(data.recibo.totalPagado).toFixed(2)}`, {
      x: 56,
      y: y + 8,
      size: 13,
      font: fontBold,
      color: azul,
    });
    page.drawText(`Cantidad en letras: ${data.recibo.cantidadEnLetras}`, {
      x: 56,
      y: y - 10,
      size: 9,
      font,
      color: negro,
      maxWidth: 500,
    });

    y -= 100;
    page.drawText("Firma del tesorero (manuscrita)", {
      x: 56,
      y,
      size: 9,
      font,
      color: gris,
    });
    page.drawLine({
      start: { x: 56, y: y - 40 },
      end: { x: 260, y: y - 40 },
      thickness: 1,
      color: gris,
    });
    page.drawText(data.tesorero.nombre, {
      x: 56,
      y: y - 55,
      size: 9,
      font,
      color: negro,
    });

    page.drawText("AquaPay — Sistema de administracion de agua potable", {
      x: 56,
      y: 40,
      size: 8,
      font,
      color: gris,
    });

    let bytes = await doc.save();
    bytes = await this.intentarFirmar(bytes);
    return bytes;
  }

  /** Preparado para node-signpdf cuando exista certificado P12. */
  private async intentarFirmar(pdfBytes: Uint8Array): Promise<Uint8Array> {
    if (!env.pdfSignP12Path || !fs.existsSync(env.pdfSignP12Path)) {
      return pdfBytes;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const signer = require("node-signpdf").default;
      const p12Buffer = fs.readFileSync(env.pdfSignP12Path);
      const signed = signer.sign(Buffer.from(pdfBytes), p12Buffer, {
        passphrase: env.pdfSignP12Password || undefined,
      });
      return new Uint8Array(signed);
    } catch {
      return pdfBytes;
    }
  }
}

export const pdfService = new PdfService();
