import { AppDataSource } from "../database/data-source";
import { Configuracion } from "../entities/Configuracion";
import { badRequest } from "../utils/errors";

export class ConfigService {
  private repo = () => AppDataSource.getRepository(Configuracion);

  async getValor(clave: string, fallback: string): Promise<string> {
    const row = await this.repo().findOne({ where: { clave } });
    return row?.valor ?? fallback;
  }

  async getTarifaAnual(): Promise<number> {
    const valor = await this.getValor("tarifa_anual", "120");
    return Number(valor);
  }

  async getLugarPago(): Promise<string> {
    return this.getValor(
      "lugar_pago",
      "Aldea Sibaná, El Asintal, Retalhuleu",
    );
  }

  async setTarifaAnual(tarifa: number, userId: string) {
    if (!Number.isFinite(tarifa) || tarifa <= 0) {
      throw badRequest("La tarifa anual debe ser mayor a 0");
    }

    let row = await this.repo().findOne({ where: { clave: "tarifa_anual" } });
    if (!row) {
      row = this.repo().create({
        clave: "tarifa_anual",
        valor: String(tarifa),
        actualizadoPor: userId,
      });
    } else {
      row.valor = String(tarifa);
      row.actualizadoPor = userId;
    }

    await this.repo().save(row);
    return { tarifaAnual: tarifa };
  }

  async getPublicConfig() {
    const [tarifaAnual, lugarPago] = await Promise.all([
      this.getTarifaAnual(),
      this.getLugarPago(),
    ]);
    return { tarifaAnual, lugarPago };
  }
}

export const configService = new ConfigService();
