import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./database/data-source";
import { ensureStorageDir } from "./lib/storage";

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("Base de datos conectada (Neon)");

  await ensureStorageDir();
  console.log(`Storage PDF: ${env.storageDir}`);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`AquaPay API en http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("No se pudo iniciar el servidor:", err);
  process.exit(1);
});
