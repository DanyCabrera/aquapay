import { ILike } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { UsuarioComunidad } from "../entities/UsuarioComunidad";
import { Vivienda } from "../entities/Vivienda";
import { Chorro } from "../entities/Chorro";
import {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
} from "../dto/usuario.dto";
import {
  ActualizarChorroDto,
  ActualizarViviendaDto,
  CrearChorroDto,
  CrearViviendaDto,
} from "../dto/vivienda.dto";
import { normalizarDpi } from "../utils/dpi";
import { conflict, notFound } from "../utils/errors";

export class UsuariosService {
  private usuarios = () => AppDataSource.getRepository(UsuarioComunidad);
  private viviendas = () => AppDataSource.getRepository(Vivienda);
  private chorros = () => AppDataSource.getRepository(Chorro);

  async listar(q?: string) {
    if (!q?.trim()) {
      return this.usuarios().find({
        order: { nombreCompleto: "ASC" },
        relations: { viviendas: { chorros: true } },
      });
    }

    const term = q.trim();
    const dpi = normalizarDpi(term);

    return this.usuarios().find({
      where: [
        { dpi: ILike(`%${dpi}%`) },
        { nombreCompleto: ILike(`%${term}%`) },
      ],
      order: { nombreCompleto: "ASC" },
      relations: { viviendas: { chorros: true } },
    });
  }

  async buscarPorDpi(dpiRaw: string) {
    const dpi = normalizarDpi(dpiRaw);
    const usuario = await this.usuarios().findOne({
      where: { dpi },
      relations: { viviendas: { chorros: true } },
    });
    if (!usuario) throw notFound("Usuario no encontrado con ese DPI");
    return usuario;
  }

  async obtener(id: string) {
    const usuario = await this.usuarios().findOne({
      where: { id },
      relations: { viviendas: { chorros: true } },
    });
    if (!usuario) throw notFound("Usuario no encontrado");
    return usuario;
  }

  async crear(dto: CrearUsuarioDto) {
    const dpi = normalizarDpi(dto.dpi);
    const existe = await this.usuarios().findOne({ where: { dpi } });
    if (existe) throw conflict("Ya existe un usuario de comunidad con ese DPI");

    const usuario = this.usuarios().create({
      nombreCompleto: dto.nombreCompleto.trim(),
      dpi,
      telefono: dto.telefono?.trim() || null,
      activo: true,
    });

    return this.usuarios().save(usuario);
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto) {
    const usuario = await this.obtener(id);
    if (dto.nombreCompleto !== undefined) {
      usuario.nombreCompleto = dto.nombreCompleto.trim();
    }
    if (dto.telefono !== undefined) {
      usuario.telefono = dto.telefono?.trim() || null;
    }
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    return this.usuarios().save(usuario);
  }

  async desactivar(id: string) {
    return this.actualizar(id, { activo: false });
  }

  async activar(id: string) {
    return this.actualizar(id, { activo: true });
  }

  async crearVivienda(usuarioId: string, dto: CrearViviendaDto) {
    await this.obtener(usuarioId);
    const vivienda = this.viviendas().create({
      usuarioId,
      direccion: dto.direccion.trim(),
      activa: true,
      anioInicioCobro: dto.anioInicioCobro ?? new Date().getFullYear(),
    });
    return this.viviendas().save(vivienda);
  }

  async actualizarVivienda(id: string, dto: ActualizarViviendaDto) {
    const vivienda = await this.viviendas().findOne({ where: { id } });
    if (!vivienda) throw notFound("Vivienda no encontrada");
    if (dto.direccion !== undefined) vivienda.direccion = dto.direccion.trim();
    if (dto.activa !== undefined) vivienda.activa = dto.activa;
    if (dto.anioInicioCobro !== undefined) {
      vivienda.anioInicioCobro = dto.anioInicioCobro;
    }
    return this.viviendas().save(vivienda);
  }

  async crearChorro(viviendaId: string, dto: CrearChorroDto) {
    const vivienda = await this.viviendas().findOne({ where: { id: viviendaId } });
    if (!vivienda) throw notFound("Vivienda no encontrada");

    const chorro = this.chorros().create({
      viviendaId,
      cantidad: dto.cantidad,
      precioCompra: String(dto.precioCompra ?? 0),
      activo: true,
      fechaInstalacion:
        dto.fechaInstalacion ?? new Date().toISOString().slice(0, 10),
    });

    return this.chorros().save(chorro);
  }

  async actualizarChorro(id: string, dto: ActualizarChorroDto) {
    const chorro = await this.chorros().findOne({ where: { id } });
    if (!chorro) throw notFound("Chorro no encontrado");
    if (dto.cantidad !== undefined) chorro.cantidad = dto.cantidad;
    if (dto.precioCompra !== undefined) {
      chorro.precioCompra = String(dto.precioCompra);
    }
    if (dto.activo !== undefined) chorro.activo = dto.activo;
    if (dto.fechaInstalacion !== undefined) {
      chorro.fechaInstalacion = dto.fechaInstalacion;
    }
    return this.chorros().save(chorro);
  }
}

export const usuariosService = new UsuariosService();
