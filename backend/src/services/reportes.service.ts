import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { AppDataSource } from "../database/data-source";
import { UsuarioComunidad } from "../entities/UsuarioComunidad";
import { Vivienda } from "../entities/Vivienda";
import { Recibo } from "../entities/Recibo";

export class ReportesService {
  async datos(tipo: string, anio = new Date().getFullYear()) {
    switch (tipo) {
      case "usuarios": {
        const usuarios = await AppDataSource.getRepository(UsuarioComunidad).find({
          order: { nombreCompleto: "ASC" },
        });
        return {
          titulo: "Reporte de usuarios registrados",
          filas: usuarios.map((u) => [
            u.dpi,
            u.nombreCompleto,
            u.telefono ?? "—",
            u.activo ? "Activo" : "Inactivo",
          ]),
          columnas: ["DPI", "Nombre", "Teléfono", "Estado"],
        };
      }
      case "viviendas": {
        const viviendas = await AppDataSource.getRepository(Vivienda).find({
          relations: { usuario: true, chorros: true },
          order: { fechaRegistro: "DESC" },
        });
        return {
          titulo: "Reporte de viviendas registradas",
          filas: viviendas.map((v) => [
            v.usuario?.nombreCompleto ?? "—",
            v.direccion,
            String((v.chorros ?? []).filter((c) => c.activo).length),
            v.activa ? "Activa" : "Inactiva",
          ]),
          columnas: ["Usuario", "Dirección", "Chorros", "Estado"],
        };
      }
      case "pagos": {
        const recibos = await AppDataSource.getRepository(Recibo)
          .createQueryBuilder("r")
          .leftJoinAndSelect("r.vivienda", "v")
          .leftJoinAndSelect("v.usuario", "u")
          .leftJoinAndSelect("r.tesorero", "t")
          .where("EXTRACT(YEAR FROM r.fecha_pago) = :anio", { anio })
          .orderBy("r.fecha_pago", "DESC")
          .getMany();
        return {
          titulo: `Reporte de pagos ${anio}`,
          filas: recibos.map((r) => [
            r.numeroRecibo,
            r.fechaPago,
            r.vivienda?.usuario?.nombreCompleto ?? "—",
            r.tipoCobro,
            `Q ${Number(r.totalPagado).toFixed(2)}`,
            r.tesorero?.nombre ?? "—",
          ]),
          columnas: ["Recibo", "Fecha", "Usuario", "Tipo", "Total", "Tesorero"],
        };
      }
      case "ingresos": {
        const rows = await AppDataSource.getRepository(Recibo)
          .createQueryBuilder("r")
          .select("EXTRACT(MONTH FROM r.fecha_pago)", "mes")
          .addSelect("COUNT(*)", "cantidad")
          .addSelect("SUM(r.total_pagado)", "total")
          .where("EXTRACT(YEAR FROM r.fecha_pago) = :anio", { anio })
          .groupBy("EXTRACT(MONTH FROM r.fecha_pago)")
          .orderBy("mes", "ASC")
          .getRawMany();

        const meses = [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun",
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
        ];

        return {
          titulo: `Ingresos por mes — ${anio}`,
          filas: rows.map((r) => [
            meses[Number(r.mes) - 1] ?? String(r.mes),
            String(r.cantidad),
            `Q ${Number(r.total).toFixed(2)}`,
          ]),
          columnas: ["Mes", "Recibos", "Ingresos"],
          serie: rows.map((r) => ({
            mes: Number(r.mes),
            total: Number(r.total),
          })),
        };
      }
      default:
        throw new Error("Tipo de reporte no válido");
    }
  }

  async exportarPdf(tipo: string, anio?: number) {
    const data = await this.datos(tipo, anio);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    let page = doc.addPage([612, 792]);
    let y = 750;

    const ensureSpace = () => {
      if (y < 60) {
        page = doc.addPage([612, 792]);
        y = 750;
      }
    };

    page.drawText("AquaPay — Aldea Sibana", {
      x: 40,
      y,
      size: 10,
      font,
      color: rgb(0.04, 0.43, 0.6),
    });
    y -= 24;
    page.drawText(data.titulo, {
      x: 40,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 28;

    page.drawText(data.columnas.join(" | "), {
      x: 40,
      y,
      size: 9,
      font: fontBold,
    });
    y -= 16;

    for (const fila of data.filas) {
      ensureSpace();
      page.drawText(fila.join(" | ").slice(0, 110), {
        x: 40,
        y,
        size: 8,
        font,
      });
      y -= 14;
    }

    return doc.save();
  }
}

export const reportesService = new ReportesService();
