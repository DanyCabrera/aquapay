import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import {
  Chorro,
  Configuracion,
  PagoAnual,
  PagoCompraChorro,
  Perfil,
  Recibo,
  ReciboPdf,
  UsuarioComunidad,
  Vivienda,
} from "../entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: env.nodeEnv === "development",
  entities: [
    Perfil,
    Configuracion,
    UsuarioComunidad,
    Vivienda,
    Chorro,
    Recibo,
    PagoAnual,
    PagoCompraChorro,
    ReciboPdf,
  ],
});
