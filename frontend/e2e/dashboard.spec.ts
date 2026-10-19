import { expect, test } from "@playwright/test";

test.describe("Dashboard tesorero", () => {
  test("muestra los ingresos del mes y abre Emitir", async ({ page }) => {
    await page.goto("/dashboard");
    for (const etiqueta of [
      "Tarifa anual",
      "Compra de chorro",
      "Total",
      "Recibos",
    ]) {
      await expect(page.getByText(etiqueta, { exact: true })).toBeVisible();
    }
    await page.getByRole("main").getByRole("link", { name: "Emitir", exact: true }).click();
    await expect(page).toHaveURL(/\/facturacion$/);
    await expect(page.getByRole("heading", { name: "Emitir", level: 1 })).toBeVisible();
  });
});

