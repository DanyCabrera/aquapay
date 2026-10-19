import { expect, type Page } from "@playwright/test";
import { TESORERO } from "./cuentas";

export async function loginPorUi(
  page: Page,
  dpi = TESORERO.dpi,
  password = TESORERO.password,
) {
  await page.goto("/login");
  await page.getByLabel("DPI").fill(dpi);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
