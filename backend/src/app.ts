import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import authRoutes from "./routes/auth.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import facturacionRoutes from "./routes/facturacion.routes";
import reportesRoutes from "./routes/reportes.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "aquapay-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/usuarios", usuariosRoutes);
  app.use("/api/facturacion", facturacionRoutes);
  app.use("/api/reportes", reportesRoutes);

  app.use(errorHandler);
  return app;
}
