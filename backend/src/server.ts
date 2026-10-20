import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./database/data-source";
import { ensureStorageDir } from "./lib/storage";

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("Base de datos conectada (Neon)");
  await AppDataSource.query(
    "ALTER TABLE recibos_pdf ADD COLUMN IF NOT EXISTS contenido BYTEA",
  );

  await ensureStorageDir();
  console.log(`Storage PDF: ${env.storageDir}`);

  const app = createApp();
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`AquaPay API escuchando en 0.0.0.0:${env.port}`);
    console.log(`Orígenes permitidos: ${env.frontendOrigins.join(", ")}`);
  });
}

bootstrap().catch((err) => {
  console.error("No se pudo iniciar el servidor:", err);
  process.exit(1);
});
