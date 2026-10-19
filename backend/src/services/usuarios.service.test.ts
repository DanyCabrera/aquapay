import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type EntityManager, QueryFailedError } from "typeorm";
import { UsuarioComunidad } from "../entities/UsuarioComunidad";
import { Vivienda } from "../entities/Vivienda";
import { Chorro } from "../entities/Chorro";
import { Recibo } from "../entities/Recibo";
import { UsuariosService } from "./usuarios.service";

const { transaction } = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("../database/data-source", () => ({ AppDataSource: { transaction } }));

describe("eliminar beneficiario", () => {
  const usuarios = { findOne: vi.fn(), delete: vi.fn() };
  const viviendas = { findBy: vi.fn(), delete: vi.fn() };
  const chorros = { delete: vi.fn() };
  const recibos = { existsBy: vi.fn() };
  const service = new UsuariosService();

  beforeEach(() => {
    vi.resetAllMocks();
    usuarios.findOne.mockResolvedValue({ id: "usuario-1" });
    viviendas.findBy.mockResolvedValue([{ id: "vivienda-1" }]);
    recibos.existsBy.mockResolvedValue(false);
    const repositories = new Map<unknown, unknown>([
      [UsuarioComunidad, usuarios], [Vivienda, viviendas], [Chorro, chorros], [Recibo, recibos],
    ]);
    const manager = { getRepository: (entity: unknown) => repositories.get(entity) } as unknown as EntityManager;
    transaction.mockImplementation(async (run: (manager: EntityManager) => Promise<unknown>) => run(manager));
  });

  it("elimina chorros y viviendas antes de eliminar a la persona sin recibos", async () => {
    await expect(service.eliminar("usuario-1")).resolves.toEqual({ id: "usuario-1", eliminado: true });
    expect(usuarios.findOne).toHaveBeenCalledWith({ where: { id: "usuario-1" }, lock: { mode: "pessimistic_write" } });
    expect(chorros.delete.mock.invocationCallOrder[0]).toBeLessThan(viviendas.delete.mock.invocationCallOrder[0]);
    expect(viviendas.delete.mock.invocationCallOrder[0]).toBeLessThan(usuarios.delete.mock.invocationCallOrder[0]);
  });

  it("conserva todos los registros cuando ya existen recibos", async () => {
    recibos.existsBy.mockResolvedValue(true);
    await expect(service.eliminar("usuario-1")).rejects.toMatchObject({ statusCode: 409 });
    expect(usuarios.delete).not.toHaveBeenCalled();
    expect(viviendas.delete).not.toHaveBeenCalled();
    expect(chorros.delete).not.toHaveBeenCalled();
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
