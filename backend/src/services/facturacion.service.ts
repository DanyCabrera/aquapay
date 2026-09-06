import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Chorro } from "../entities/Chorro";
import { PagoAnual } from "../entities/PagoAnual";
import { PagoCompraChorro } from "../entities/PagoCompraChorro";
import { Perfil } from "../entities/Perfil";
import { Recibo } from "../entities/Recibo";
import { ReciboPdf } from "../entities/ReciboPdf";
import { Vivienda } from "../entities/Vivienda";
import {
  CobroCompraChorroDto,
  CobroTarifaAnualDto,
} from "../dto/facturacion.dto";
import { publicPdfUrl, savePdf } from "../lib/storage";
import { numeroALetras } from "../utils/numero-a-letras";
import { badRequest, conflict, notFound } from "../utils/errors";
import { configService } from "./config.service";
import { pdfService } from "./pdf.service";

export class FacturacionService {
  private viviendas = () => AppDataSource.getRepository(Vivienda);
  private chorros = () => AppDataSource.getRepository(Chorro);
  private recibos = () => AppDataSource.getRepository(Recibo);
  private pagosAnuales = () => AppDataSource.getRepository(PagoAnual);
  private pagosCompra = () => AppDataSource.getRepository(PagoCompraChorro);
  private pdfs = () => AppDataSource.getRepository(ReciboPdf);
  private perfiles = () => AppDataSource.getRepository(Perfil);

  private async siguienteNumero(anio: number) {
    const ultimo = await this.recibos().findOne({
      where: { anioRecibo: anio },
      order: { secuencia: "DESC" },
    });
    const secuencia = (ultimo?.secuencia ?? 0) + 1;
    const numeroRecibo = String(secuencia).padStart(3, "0");
    return { secuencia, numeroRecibo, anioRecibo: anio };
  }

  async aniosPendientes(viviendaId: string) {
    const vivienda = await this.viviendas().findOne({
      where: { id: viviendaId },
      relations: { chorros: true, usuario: true },
    });
    if (!vivienda) throw notFound("Vivienda no encontrada");

    const chorrosActivos = (vivienda.chorros ?? []).filter((c) => c.activo);
    if (chorrosActivos.length === 0) {
      return {
        vivienda,
        tarifaAnual: await configService.getTarifaAnual(),
        aniosPendientes: [] as number[],
        totalChorros: 0,
        detalle: [] as { anio: number; monto: number }[],
        chorrosPendientesCompra: [] as {
          id: string;
          cantidad: number;
          precioCompra: string;
          activo: boolean;
        }[],
      };
    }

    const anioActual = new Date().getFullYear();
    const aniosPosibles: number[] = [];
    for (let a = vivienda.anioInicioCobro; a <= anioActual; a++) {
      aniosPosibles.push(a);
    }

    const pagos = await this.pagosAnuales().find({
      where: { chorroId: In(chorrosActivos.map((c) => c.id)) },
    });

    const pagadosPorAnio = new Map<number, Set<string>>();
    for (const p of pagos) {
      if (!pagadosPorAnio.has(p.anio)) pagadosPorAnio.set(p.anio, new Set());
      pagadosPorAnio.get(p.anio)!.add(p.chorroId);
    }

    const pendientes: number[] = [];
    for (const anio of aniosPosibles) {
      const set = pagadosPorAnio.get(anio) ?? new Set();
      const completo = chorrosActivos.every((c) => set.has(c.id));
      if (!completo) pendientes.push(anio);
    }

    const tarifaAnual = await configService.getTarifaAnual();
    const totalChorros = chorrosActivos.reduce((s, c) => s + c.cantidad, 0);
    const detalle = pendientes.map((anio) => ({
      anio,
      monto: tarifaAnual * totalChorros,
    }));

    const pagosCompra = chorrosActivos.length
      ? await this.pagosCompra().find({
          where: { chorroId: In(chorrosActivos.map((c) => c.id)) },
        })
      : [];
    const compraPagada = new Set(pagosCompra.map((p) => p.chorroId));
    const chorrosPendientesCompra = chorrosActivos
      .filter((c) => Number(c.precioCompra) > 0 && !compraPagada.has(c.id))
      .map((c) => ({
        id: c.id,
        cantidad: c.cantidad,
        precioCompra: c.precioCompra,
        activo: c.activo,
      }));

    return {
      vivienda,
      tarifaAnual,
      aniosPendientes: pendientes,
      totalChorros,
      detalle,
      chorrosPendientesCompra,
    };
  }

  async previewSiguienteRecibo() {
    const anio = new Date().getFullYear();
    const { numeroRecibo, anioRecibo, secuencia } =
      await this.siguienteNumero(anio);
    return { numeroRecibo, anioRecibo, secuencia };
  }

  async cobrarTarifaAnual(dto: CobroTarifaAnualDto, userId: string) {
    const info = await this.aniosPendientes(dto.viviendaId);
    const aniosInvalidos = dto.anios.filter(
      (a) => !info.aniosPendientes.includes(a),
    );
    if (aniosInvalidos.length) {
      throw badRequest(
        `Los años ${aniosInvalidos.join(", ")} no están pendientes o ya fueron pagados`,
      );
    }

    const chorrosActivos = (info.vivienda.chorros ?? []).filter((c) => c.activo);
    if (!chorrosActivos.length) {
      throw badRequest("La vivienda no tiene chorros activos");
    }

    const tarifa = info.tarifaAnual;
    const totalChorros = info.totalChorros;
    const total = tarifa * totalChorros * dto.anios.length;
    const anioDoc = new Date().getFullYear();
    const { secuencia, numeroRecibo, anioRecibo } =
      await this.siguienteNumero(anioDoc);
    const lugarPago = await configService.getLugarPago();
    const fechaPago = dto.fechaPago ?? new Date().toISOString().slice(0, 10);
    const descripcion =
      dto.descripcionPago ??
      `Pago tarifa anual ${dto.anios.sort().join(", ")} — ${totalChorros} chorro(s)`;

    return AppDataSource.transaction(async (manager) => {
      const recibo = manager.create(Recibo, {
        numeroRecibo,
        anioRecibo,
        secuencia,
        viviendaId: dto.viviendaId,
        tipoCobro: "tarifa_anual",
        totalPagado: total.toFixed(2),
        cantidadEnLetras: numeroALetras(total),
        descripcionPago: descripcion,
        lugarPago,
        fechaPago,
        creadoPor: userId,
      });
      const saved = await manager.save(recibo);

      for (const anio of dto.anios) {
        for (const chorro of chorrosActivos) {
          const monto = tarifa * chorro.cantidad;
          await manager.save(
            manager.create(PagoAnual, {
              reciboId: saved.id,
              chorroId: chorro.id,
              anio,
              montoPagado: monto.toFixed(2),
            }),
          );
        }
      }

      const tesorero = await manager.findOneByOrFail(Perfil, { id: userId });
      const pdfBytes = await pdfService.generarRecibo({
        recibo: saved,
        usuario: info.vivienda.usuario,
        vivienda: info.vivienda,
        tesorero,
        detalleLineas: dto.anios
          .sort()
          .map(
            (a) =>
              `Año ${a}: Q ${(tarifa * totalChorros).toFixed(2)} (${totalChorros} chorro(s) × Q ${tarifa.toFixed(2)})`,
          ),
      });

      const pdfMeta = await this.subirPdf(saved, pdfBytes, manager);
      return { recibo: saved, pdf: pdfMeta };
    });
  }

  async cobrarCompraChorro(dto: CobroCompraChorroDto, userId: string) {
    const vivienda = await this.viviendas().findOne({
      where: { id: dto.viviendaId },
      relations: { usuario: true, chorros: true },
    });
    if (!vivienda) throw notFound("Vivienda no encontrada");

    const chorro = await this.chorros().findOne({ where: { id: dto.chorroId } });
    if (!chorro || chorro.viviendaId !== dto.viviendaId) {
      throw notFound("Chorro no encontrado en esta vivienda");
    }

    const yaPagado = await this.pagosCompra().findOne({
      where: { chorroId: chorro.id },
    });
    if (yaPagado) throw conflict("La compra de este chorro ya fue cobrada");

    const total = Number(chorro.precioCompra);
    if (total <= 0) {
      throw badRequest("El chorro no tiene precio de compra configurado");
    }

    const anioDoc = new Date().getFullYear();
    const { secuencia, numeroRecibo, anioRecibo } =
      await this.siguienteNumero(anioDoc);
    const lugarPago = await configService.getLugarPago();
    const fechaPago = dto.fechaPago ?? new Date().toISOString().slice(0, 10);

    return AppDataSource.transaction(async (manager) => {
      const recibo = manager.create(Recibo, {
        numeroRecibo,
        anioRecibo,
        secuencia,
        viviendaId: dto.viviendaId,
        tipoCobro: "compra_chorro",
        totalPagado: total.toFixed(2),
        cantidadEnLetras: numeroALetras(total),
        descripcionPago:
          dto.descripcionPago ??
          `Cobro por compra de chorro (${chorro.cantidad} unidad(es))`,
        lugarPago,
        fechaPago,
        creadoPor: userId,
      });
      const saved = await manager.save(recibo);

      await manager.save(
        manager.create(PagoCompraChorro, {
          reciboId: saved.id,
          chorroId: chorro.id,
          montoPagado: total.toFixed(2),
          fechaPago,
        }),
      );

      const tesorero = await manager.findOneByOrFail(Perfil, { id: userId });
      const pdfBytes = await pdfService.generarRecibo({
        recibo: saved,
        usuario: vivienda.usuario,
        vivienda,
        tesorero,
        detalleLineas: [
          `Compra de chorro: Q ${total.toFixed(2)} (${chorro.cantidad} unidad(es))`,
        ],
      });

      const pdfMeta = await this.subirPdf(saved, pdfBytes, manager);
      return { recibo: saved, pdf: pdfMeta };
    });
  }

  private async subirPdf(
    recibo: Recibo,
    bytes: Uint8Array,
    manager: EntityManager,
  ) {
    const nombre = `recibo-${recibo.anioRecibo}-${recibo.numeroRecibo}.pdf`;
    const ruta = `${recibo.anioRecibo}/${nombre}`;

    try {
      await savePdf(ruta, bytes);
    } catch (error) {
      console.warn(
        "Storage local:",
        error instanceof Error ? error.message : error,
      );
    }

    const pdf = manager.create(ReciboPdf, {
      reciboId: recibo.id,
      nombreArchivo: nombre,
      rutaStorage: ruta,
      urlPublica: publicPdfUrl(recibo.id),
      tamañoBytes: bytes.length,
      tipoMime: "application/pdf",
    });

    const saved = await manager.save(pdf);
    return {
      ...saved,
      downloadBase64: Buffer.from(bytes).toString("base64"),
    };
  }

  async historialPorUsuario(usuarioId: string, anio?: number) {
    const viviendas = await this.viviendas().find({ where: { usuarioId } });
    if (!viviendas.length) return [];

    const qb = this.recibos()
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.tesorero", "t")
      .leftJoinAndSelect("r.pdf", "pdf")
      .leftJoinAndSelect("r.vivienda", "v")
      .leftJoinAndSelect("v.usuario", "u")
      .where("r.vivienda_id IN (:...ids)", {
        ids: viviendas.map((v) => v.id),
      })
      .orderBy("r.fecha_pago", "DESC");

    if (anio) qb.andWhere("EXTRACT(YEAR FROM r.fecha_pago) = :anio", { anio });

    const rows = await qb.getMany();
    return rows.map((r) => {
      if (r.pdf) r.pdf.urlPublica = publicPdfUrl(r.id);
      return r;
    });
  }

  async listarRecibos(opts?: { q?: string; limit?: number }) {
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    const q = opts?.q?.trim();

    // 1) IDs sin joins+take (TypeORM DISTINCT + relaciones rompe / columnas mal mapeadas)
    let ids: string[];
    if (!q) {
      const rows = await this.recibos().find({
        select: { id: true },
        order: { fechaPago: "DESC", fechaCreacion: "DESC" },
        take: limit,
      });
      ids = rows.map((r) => r.id);
    } else {
      const rows = await this.recibos()
        .createQueryBuilder("r")
        .leftJoin("r.vivienda", "v")
        .leftJoin("v.usuario", "u")
        .select("r.id", "id")
        .where(
          `(r.numero_recibo ILIKE :q OR u.nombre_completo ILIKE :q OR u.dpi ILIKE :q)`,
          { q: `%${q}%` },
        )
        .orderBy("r.fecha_pago", "DESC")
        .limit(limit)
        .getRawMany<{ id: string }>();
      ids = rows.map((r) => r.id).filter(Boolean);
    }

    if (!ids.length) return [];

    // 2) Cargar relaciones sin take()
    const encontrados = await this.recibos().find({
      where: { id: In(ids) },
      relations: {
        tesorero: true,
        pdf: true,
        vivienda: { usuario: true },
      },
    });

    const order = new Map(ids.map((id, i) => [id, i]));
    return encontrados
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((r) => {
        if (r.pdf) r.pdf.urlPublica = publicPdfUrl(r.id);
        return r;
      });
  }

  async obtenerRecibo(id: string) {
    const recibo = await this.recibos().findOne({
      where: { id },
      relations: {
        vivienda: { usuario: true },
        tesorero: true,
        pdf: true,
        pagosAnuales: true,
        pagosCompra: true,
      },
    });
    if (!recibo) throw notFound("Recibo no encontrado");

    if (recibo.pdf) {
      recibo.pdf.urlPublica = publicPdfUrl(recibo.id);
    }

    return recibo;
  }

  async leerPdf(reciboId: string) {
    const pdf = await this.pdfs().findOne({ where: { reciboId } });
    if (!pdf?.rutaStorage) throw notFound("PDF no encontrado");

    const { readPdf } = await import("../lib/storage");
    try {
      const bytes = await readPdf(pdf.rutaStorage);
      return { bytes, nombreArchivo: pdf.nombreArchivo, tipoMime: pdf.tipoMime };
    } catch {
      throw notFound("Archivo PDF no disponible en storage");
    }
  }

  async dashboard() {
    const anio = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;

    const totalUsuarios = await AppDataSource.getRepository(
      (await import("../entities/UsuarioComunidad")).UsuarioComunidad,
    ).count({ where: { activo: true } });

    const totalViviendas = await this.viviendas().count({
      where: { activa: true },
    });

    const totalChorros = await AppDataSource.getRepository(
      (await import("../entities/Chorro")).Chorro,
    ).count({ where: { activo: true } });

    const recibosMes = await this.recibos()
      .createQueryBuilder("r")
      .where("EXTRACT(YEAR FROM r.fecha_pago) = :anio", { anio })
      .andWhere("EXTRACT(MONTH FROM r.fecha_pago) = :mes", { mes })
      .getMany();

    const ingresosMes = recibosMes.reduce(
      (s, r) => s + Number(r.totalPagado),
      0,
    );

    const ingresosAnioRows = await this.recibos()
      .createQueryBuilder("r")
      .select("EXTRACT(MONTH FROM r.fecha_pago)", "mes")
      .addSelect("SUM(r.total_pagado)", "total")
      .where("EXTRACT(YEAR FROM r.fecha_pago) = :anio", { anio })
      .groupBy("EXTRACT(MONTH FROM r.fecha_pago)")
      .orderBy("mes", "ASC")
      .getRawMany();

    return {
      totalUsuarios,
      totalViviendas,
      totalChorros,
      facturasMes: recibosMes.length,
      ingresosMes,
      ingresosPorMes: ingresosAnioRows.map((r) => ({
        mes: Number(r.mes),
        total: Number(r.total),
      })),
      tarifaAnual: await configService.getTarifaAnual(),
    };
  }
}

export const facturacionService = new FacturacionService();
