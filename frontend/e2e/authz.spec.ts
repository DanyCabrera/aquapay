import { expect, test } from "@playwright/test";

const BLOQUEADAS = ["/usuarios", "/pagos", "/reportes", "/configuracion"];

test.describe("Autorización del tesorero", () => {
  test("el menú solo muestra Dashboard, Emitir e Historial", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Principal" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Emitir", exact: true }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Historial" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Beneficiarios" })).toHaveCount(
      0,
    );
    await expect(
      nav.getByRole("link", { name: "Consultar pago" }),
    ).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Reportes" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Tarifa" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Emitir recibo" }),
    ).toBeVisible();
  });

  for (const ruta of BLOQUEADAS) {
    test(`${ruta} redirige al dashboard`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(
        page.getByRole("heading", { name: "Dashboard" }),
      ).toBeVisible();
    });
  }
});
