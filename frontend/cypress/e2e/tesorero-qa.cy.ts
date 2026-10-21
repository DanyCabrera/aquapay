/// <reference types="cypress" />
export {};

const year = new Date().getFullYear();
const user = { id: "qa-tesorero", nombre: "QA Tesorero AquaPay", rol: "tesorero", activo: true };
const vivienda = { id: "qa-vivienda", direccion: "Vivienda de prueba", activa: true };
const beneficiario = { id: "qa-beneficiario", nombreCompleto: "Beneficiario QA", dpi: "9902600000001", activo: true, viviendas: [vivienda] };
const recibo = { id: "qa-recibo", numeroRecibo: `${year}-003`, fechaPago: `${year}-10-20`, tipoCobro: "compra_chorro", totalPagado: "1500", vivienda: { ...vivienda, usuario: beneficiario } };
const ok = (data: unknown) => ({ body: { success: true, data } });
function visitar(path: string) {
  cy.visit(path, { onBeforeLoad(win) {
    win.localStorage.setItem("aquapay_token", "qa-token-simulado");
    win.localStorage.setItem("aquapay_user", JSON.stringify(user));
  } });
}
function elegirCompra() {
  visitar("/facturacion");
  cy.get('select[aria-label="Beneficiario"]').select(beneficiario.id);
  cy.contains('[role="radio"]', "Compra de chorro").click();
  cy.get("#descripcion-pago").type("Detalle que debe conservarse si falla el cobro.");
  cy.contains("button", /^Emitir$/).should("be.enabled");
}

describe("Correcciones del informe QA del tesorero", () => {
  beforeEach(() => {
    // Toda la API se simula: estas pruebas no autentican ni escriben en producción.
    cy.intercept("**/api/**", { statusCode: 503, body: { success: false, message: "Ruta no simulada" } });
    cy.intercept("GET", "**/api/auth/me", ok(user));
    cy.intercept("GET", "**/api/usuarios", ok([beneficiario]));
    cy.intercept("GET", "**/api/facturacion/recibos?*", ok([]));
    cy.intercept("GET", "**/api/facturacion/siguiente-recibo", ok({ numeroRecibo: "003", anioRecibo: year }));
    cy.intercept("GET", "**/api/facturacion/pendientes/*", ok({ tarifaAnual: 120, totalChorros: 1, aniosPendientes: [year], detalle: [{ anio: year, monto: 120 }], vivienda, chorrosPendientesCompra: [{ id: "qa-chorro", cantidad: 1, precioCompra: "1500", activo: true }] }));
  });

  it("QA-T01: mantiene el nombre completo sin el saludo recortado", () => {
    cy.intercept("GET", "**/api/facturacion/dashboard", ok({ ingresosMes: 0, facturasMes: 0, ingresosPorMes: [], tarifaAnual: 120, totalUsuarios: 0, totalViviendas: 0 }));
    visitar("/dashboard");
    cy.contains("h2", "Resumen de tesorería").should("be.visible");
    cy.contains("aside:visible", user.nombre).should("be.visible");
    cy.get("main").should("not.contain.text", "Hola, QA.");
  });

  it("QA-T02: presenta el contador sin espacios antes del punto y con singular", () => {
    visitar("/facturacion");
    cy.get("#buscar").type("Beneficiario ");
    cy.contains('[aria-live="polite"]', '1 beneficiario activo encontrado para «Beneficiario».').should("be.visible");
    cy.get("#buscar").clear().type("Inexistente");
    cy.contains('[aria-live="polite"]', '0 beneficiarios activos encontrados para «Inexistente».').should("be.visible");
  });

  for (const cantidad of [0, 1, 2]) {
    it(`QA-T03: muestra correctamente ${cantidad} recibo(s) en el historial`, () => {
      cy.intercept("GET", "**/api/facturacion/recibos?*", ok(Array.from({ length: cantidad }, (_, i) => ({ ...recibo, id: `qa-${i}` }))));
      visitar("/historial");
      cy.contains('[aria-live="polite"]', `${cantidad} ${cantidad === 1 ? "recibo" : "recibos"} · Todos los años`).should("be.visible");
    });
  }

  it("QA-T04: tras una compra exitosa limpia el formulario y vuelve a tarifa anual", () => {
    cy.intercept("POST", "**/api/facturacion/cobrar/compra-chorro", { statusCode: 201, body: { success: true, data: { recibo, pdf: { nombreArchivo: "qa.pdf" } } } }).as("cobro");
    elegirCompra();
    cy.intercept("GET", "**/api/facturacion/siguiente-recibo", ok({ numeroRecibo: "004", anioRecibo: year }));
    cy.contains("button", /^Emitir$/).click();
    cy.wait("@cobro").its("response.statusCode").should("eq", 201);
    cy.get('[role="dialog"]').should("be.visible");
    cy.contains('[role="dialog"] button', "Cerrar").click();
    cy.contains('[role="radio"]', "Tarifa anual").should("have.attr", "aria-checked", "true");
    cy.get('select[aria-label="Beneficiario"]').should("have.value", "");
    cy.get("#descripcion-pago").should("have.value", "");
    cy.get("#anio").should("have.value", String(year));
    cy.contains("button", /^Emitir$/).should("be.disabled");
    cy.get('[data-testid="recibo-correlativo"]').should("contain.text", "004");
  });

  it("conserva concepto, beneficiario y descripción cuando el cobro falla", () => {
    cy.intercept("POST", "**/api/facturacion/cobrar/compra-chorro", { statusCode: 503, body: { success: false, message: "No se pudo registrar el cobro" } }).as("fallo");
    elegirCompra();
    cy.contains("button", /^Emitir$/).click();
    cy.wait("@fallo");
    cy.contains('[role="radio"]', "Compra de chorro").should("have.attr", "aria-checked", "true");
    cy.get('select[aria-label="Beneficiario"]').should("have.value", beneficiario.id);
    cy.get("#descripcion-pago").should("have.value", "Detalle que debe conservarse si falla el cobro.");
    cy.contains("button", /^Emitir$/).should("be.enabled");
  });
});
