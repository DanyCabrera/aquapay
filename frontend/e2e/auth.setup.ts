import { mkdirSync } from "node:fs";
import { test as setup } from "@playwright/test";
import { loginORestablecer } from "./helpers/api";
import { TESORERO } from "./helpers/cuentas";
import { loginPorUi } from "./helpers/login";

const authFile = "e2e/.auth/tesorero.json";

setup("guardar sesión del tesorero", async ({ page }) => {
  await loginORestablecer(TESORERO.dpi, TESORERO.password);
  mkdirSync("e2e/.auth", { recursive: true });
  await loginPorUi(page);
  await page.context().storageState({ path: authFile });
});
