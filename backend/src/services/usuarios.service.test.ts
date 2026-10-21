import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type EntityManager, QueryFailedError } from "typeorm";
import { UsuarioComunidad } from "../entities/UsuarioComunidad";
import { Vivienda } from "../entities/Vivienda";
import { Chorro } from "../entities/Chorro";
import { Recibo } from "../entities/Recibo";
import { UsuariosService } from "./usuarios.service";

const { transaction, bloquearRecibos, borrarRecibos } = vi.hoisted(() => ({
  transaction: vi.fn(),
  bloquearRecibos: vi.fn(),
  borrarRecibos: vi.fn(),
}));
vi.mock("../database/data-source", () => ({ AppDataSource: { transaction } }));
vi.mock("./recibos-transaccion", () => ({ bloquearRecibos, borrarRecibos }));

describe("eliminar beneficiario", () => {
  const usuarios = { findOne: vi.fn(), delete: vi.fn() };
  const viviendas = { findBy: vi.fn(), delete: vi.fn() };
  const chorros = { delete: vi.fn() };
  const recibos = { existsBy: vi.fn(), findBy: vi.fn(), findOne: vi.fn() };
  const service = new UsuariosService();
  const anio = new Date().getFullYear();

  beforeEach(() => {
    vi.resetAllMocks();
    usuarios.findOne.mockResolvedValue({ id: "usuario-1" });
    viviendas.findBy.mockResolvedValue([{ id: "vivienda-1" }]);
    recibos.existsBy.mockResolvedValue(false);
    recibos.findBy.mockResolvedValue([]);
    recibos.findOne.mockResolvedValue(null);
    const repositories = new Map<unknown, unknown>([
      [UsuarioComunidad, usuarios], [Vivienda, viviendas], [Chorro, chorros], [Recibo, recibos],
    ]);
    const manager = { getRepository: (entity: unknown) => repositories.get(entity) } as unknown as EntityManager;
    transaction.mockImplementation(async (run: (manager: EntityManager) => Promise<unknown>) => run(manager));
  });

  it("elimina chorros y viviendas antes de eliminar a la persona sin recibos", async () => {
    await expect(service.eliminar("usuario-1")).resolves.toEqual({
      id: "usuario-1",
      eliminado: true,
      siguiente: { secuencia: 1, numeroRecibo: "001", anioRecibo: anio },
    });
    expect(usuarios.findOne).toHaveBeenCalledWith({ where: { id: "usuario-1" }, lock: { mode: "pessimistic_write" } });
    expect(chorros.delete.mock.invocationCallOrder[0]).toBeLessThan(viviendas.delete.mock.invocationCallOrder[0]);
    expect(viviendas.delete.mock.invocationCallOrder[0]).toBeLessThan(usuarios.delete.mock.invocationCallOrder[0]);
    expect(borrarRecibos).not.toHaveBeenCalled();
  });

  it("conserva todos los registros cuando ya existen recibos", async () => {
    recibos.existsBy.mockResolvedValue(true);
    await expect(service.eliminar("usuario-1")).rejects.toMatchObject({ statusCode: 409 });
    expect(usuarios.delete).not.toHaveBeenCalled();
    expect(viviendas.delete).not.toHaveBeenCalled();
    expect(chorros.delete).not.toHaveBeenCalled();
    expect(borrarRecibos).not.toHaveBeenCalled();
  });

  it("elimina también los recibos cuando se confirma eliminarRecibos y continúa el correlativo", async () => {
    recibos.existsBy.mockResolvedValue(true);
    recibos.findBy.mockResolvedValue([{ id: "recibo-1" }, { id: "recibo-2" }]);
    recibos.findOne.mockResolvedValue({ secuencia: 5 });
    await expect(service.eliminar("usuario-1", true)).resolves.toEqual({
      id: "usuario-1",
      eliminado: true,
      siguiente: { secuencia: 6, numeroRecibo: "006", anioRecibo: anio },
    });
    expect(borrarRecibos).toHaveBeenCalledWith(expect.anything(), ["recibo-1", "recibo-2"]);
    expect(usuarios.delete).toHaveBeenCalled();
  });

  it("reinicia el correlativo a 001 si al eliminar al beneficiario no queda ningún recibo", async () => {
    recibos.existsBy.mockResolvedValue(true);
    recibos.findBy.mockResolvedValue([{ id: "recibo-1" }]);
    recibos.findOne.mockResolvedValue(null);
    await expect(service.eliminar("usuario-1", true)).resolves.toMatchObject({
      siguiente: { secuencia: 1, numeroRecibo: "001", anioRecibo: anio },
    });
  });

  it("devuelve 404 si la persona no existe", async () => {
    usuarios.findOne.mockResolvedValue(null);
    await expect(service.eliminar("ausente")).rejects.toMatchObject({ statusCode: 404 });
    expect(viviendas.findBy).not.toHaveBeenCalled();
    expect(usuarios.delete).not.toHaveBeenCalled();
  });

  it("informa un conflicto si aparece una referencia durante la transacción", async () => {
    chorros.delete.mockRejectedValue(new QueryFailedError("DELETE", [], Object.assign(new Error("foreign key"), { code: "23503" })));
    await expect(service.eliminar("usuario-1")).rejects.toMatchObject({ statusCode: 409 });
    expect(usuarios.delete).not.toHaveBeenCalled();
  });
});
