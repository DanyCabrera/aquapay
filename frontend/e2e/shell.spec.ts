import { expect, test } from "@playwright/test";

test.describe("Shell del tesorero", () => {
  test("filtrar el menú oculta y vuelve a mostrar Emitir", async ({ page }) => {
    await page.goto("/dashboard");
    const filtro = page.locator('[aria-label="Filtrar el menú"]:visible');
    const nav = page.locator('nav[aria-label="Principal"]:visible');

    await filtro.fill("historial");
    await expect(nav.getByRole("link", { name: "Historial" })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Emitir", exact: true }),
    ).toHaveCount(0);

    await filtro.fill("");
    await expect(
      nav.getByRole("link", { name: "Emitir", exact: true }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Historial" })).toBeVisible();
  });

  test("en el teléfono el menú abre Historial", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("link", { name: "Historial" }).click();
    await expect(page).toHaveURL(/\/historial$/);
    await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();
  });
});

