import { expect, test } from "@playwright/test";
import {
  desactivarBeneficiario,
  sembrarBeneficiarioConDeuda,
  type BeneficiarioDeuda,
} from "./helpers/api";

test.describe("Emitir factura", () => {
  let deuda: BeneficiarioDeuda;

  test.beforeAll(async () => {
    deuda = await sembrarBeneficiarioConDeuda();
  });

  test.afterAll(async () => {
    if (deuda?.usuarioId) await desactivarBeneficiario(deuda.usuarioId);
  });

  test("cobra la tarifa y abre el PDF para imprimir o descargar", async ({
    page,
  }) => {
    await page.goto("/facturacion");
    const lista = page.getByRole("combobox", { name: "Beneficiario" });
    await lista.fill(deuda.nombre);
    const opcion = page.getByRole("option", { name: new RegExp(deuda.nombre) });
    await expect(opcion).toHaveCount(1);
    await opcion.click();

    await expect(page.getByText(/Se cobrará/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Emitir" })).toBeEnabled();
    await page.getByRole("button", { name: "Emitir" }).click();

    await expect(page.getByText(/Recibo .+ emitido/)).toBeVisible();
    await expect(
      page.getByText(
        "Vista previa lista para imprimir. También puede descargar el PDF.",
      ),
    ).toBeVisible();
    await expect(page.getByTitle(/Vista previa de Recibo/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Descargar" })).toBeEnabled();

    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar" }).click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toMatch(/\.pdf$/i);
    await expect(page.getByRole("dialog")).toBeVisible();

    await page
      .getByRole("button", { name: "Cerrar", exact: true })
      .last()
      .click();
    await expect(page.getByRole("dialog")).toBeHidden();
    const fila = page.getByRole("row", { name: new RegExp(deuda.nombre) });
    await expect(fila).toBeVisible();
    await expect(fila.getByRole("button", { name: "Ver PDF" })).toBeVisible();
  });
});
