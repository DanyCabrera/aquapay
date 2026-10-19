import { expect, test } from "@playwright/test";
import { TESORERO } from "./helpers/cuentas";
import { loginPorUi } from "./helpers/login";

test.describe("Auth tesorero", () => {
  test("login válido entra al dashboard", async ({ page }) => {
    await loginPorUi(page);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("login inválido se queda en la pantalla y muestra error", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("DPI").fill(TESORERO.dpi);
    await page
      .getByRole("textbox", { name: "Contraseña", exact: true })
      .fill("ClaveMala1");
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();
    await expect(page.getByText("DPI o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toHaveCount(0);
  });

  test("DPI incompleto y clave corta no envían el formulario", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("DPI").fill("1234");
    await page.getByLabel("DPI").blur();
    const clave = page.getByRole("textbox", { name: "Contraseña", exact: true });
    await clave.fill("corta");
    await clave.blur();
    await expect(page.getByText("El DPI debe tener 13 dígitos.")).toBeVisible();
    await expect(page.getByText("Mínimo 8 caracteres.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar Sesión" }),
    ).toBeDisabled();
    await expect(page).toHaveURL(/\/login/);
  });

  test("salir vuelve al login y el dashboard ya no entra", async ({ page }) => {
    await loginPorUi(page);
    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
