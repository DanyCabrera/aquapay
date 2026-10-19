import { expect, test, type Page } from "@playwright/test";
import {
  cobrarTarifa,
  desactivarBeneficiario,
  sembrarBeneficiarioConDeuda,
} from "./helpers/api";

async function esperarListadoInicial(page: Page) {
  const listo = page.waitForResponse(
    (r) => r.url().includes("/api/facturacion/recibos") && r.ok(),
  );
  await page.goto("/historial");
  await listo;
}

test.describe("Historial", () => {
  test("encuentra el recibo emitido y abre el PDF", async ({ page }) => {
    const deuda = await sembrarBeneficiarioConDeuda();
    try {
      await cobrarTarifa(deuda);
      await esperarListadoInicial(page);
      await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();

      const busqueda = page.waitForResponse((r) => {
        const url = new URL(r.url());
        return (
          url.pathname.endsWith("/recibos") &&
          url.searchParams.get("q") === deuda.nombre
        );
      });
      await page.getByLabel("Buscar facturas").fill(deuda.nombre);
      await page.getByRole("button", { name: "Buscar" }).click();
      await busqueda;

      const fila = page.getByRole("row", { name: new RegExp(deuda.nombre) });
      await expect(fila).toHaveCount(1);
      await fila.getByRole("button", { name: "Ver PDF" }).click();
      await expect(page.getByRole("heading", { name: /Recibo / })).toBeVisible();
      await expect(page.getByRole("button", { name: "Imprimir" })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Descargar" })).toBeEnabled();
      await expect(page.getByTitle(/Vista previa de Recibo/)).toBeVisible();
    } finally {
      await desactivarBeneficiario(deuda.usuarioId);
    }
  });

  test("un filtro sin coincidencias no rompe la página", async ({ page }) => {
    await esperarListadoInicial(page);
    await page.getByLabel("Buscar facturas").fill("zzz-e2e-sin-recibo");
    await page.getByLabel("Año de la factura").selectOption("2015");
    const busqueda = page.waitForResponse((r) => {
      const url = new URL(r.url());
      return (
        url.pathname.endsWith("/recibos") &&
        url.searchParams.get("q") === "zzz-e2e-sin-recibo"
      );
    });
    await page.getByRole("button", { name: "Buscar" }).click();
    await busqueda;
    await expect(
      page.getByRole("heading", { name: "Sin coincidencias" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();
  });

  test("la paginación avanza si hay más de una página", async ({ page }) => {
    await esperarListadoInicial(page);
    const siguiente = page.getByRole("button", { name: "Siguiente" });
    const anterior = page.getByRole("button", { name: "Anterior" });
    await expect(anterior).toBeVisible();
    await expect(siguiente).toBeVisible();

    if (await siguiente.isEnabled()) {
      await siguiente.click();
      await expect(page.getByText(/^2 \/ /)).toBeVisible();
      await expect(anterior).toBeEnabled();
      await anterior.click();
      await expect(page.getByText(/^1 \/ /)).toBeVisible();
      return;
    }

    await expect(anterior).toBeDisabled();
    await expect(page.getByText(/^1 \/ 1$/)).toBeVisible();
  });
});

