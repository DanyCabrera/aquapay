import { AppDataSource } from "../src/database/data-source";
import { ensureStorageDir } from "../src/lib/storage";
import { authService } from "../src/services/auth.service";

async function main() {
  await AppDataSource.initialize();
  console.log("DB OK");
  await ensureStorageDir();
  console.log("Storage OK");

  const puede = await authService.puedeRegistrarAdministrador();
  console.log("puedeRegistrarAdministrador:", puede);

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
