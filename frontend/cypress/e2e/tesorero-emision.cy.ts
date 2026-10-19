/// <reference types="cypress" />
export {};

const year = new Date().getFullYear();
const vivienda = { id: "vivienda-prueba", direccion: "Sector de pruebas", activa: true };
const beneficiario = { id: "usuario-prueba", nombreCompleto: "Beneficiario de prueba visual", dpi: "9902600000001", activo: true, viviendas: [vivienda] };

describe("TESORERO — resumen fijo y descripción opcional", () => {
  beforeEach(() => {
    cy.session("tesorero-emision", () => {
      cy.env(["apiUrl", "tesoreroDpi", "tesoreroPassword"]).then((env) => {
        cy.request({ method: "POST", url: `${env.apiUrl}/api/auth/login`, body: { dpi: env.tesoreroDpi, password: env.tesoreroPassword }, log: false }).then(({ body }) => {
          expect(body.data.usuario.rol).to.eq("tesorero");
          cy.visit("/login", { onBeforeLoad(win) { win.localStorage.setItem("aquapay_token", body.data.accessToken); win.localStorage.setItem("aquapay_user", JSON.stringify(body.data.usuario)); } });
          cy.location("pathname", { timeout: 60_000 }).should("eq", "/dashboard");
        });
      });
    });
    cy.intercept("GET", "**/api/usuarios", { body: { success: true, data: [beneficiario] } });
    cy.intercept("GET", "**/api/facturacion/pendientes/*", { body: { success: true, data: { tarifaAnual: 120, totalChorros: 2, aniosPendientes: [year], detalle: [{ anio: year, monto: 240 }], vivienda, chorrosPendientesCompra: [{ id: "chorro-prueba", cantidad: 2, precioCompra: "1500", activo: true }] } } }).as("pendientes");
    cy.visit("/facturacion");
    cy.get('select[aria-label="Beneficiario"]').select(beneficiario.id);
    cy.wait("@pendientes");
    cy.contains("button", /^Emitir$/).should("be.enabled");
  });

  it("conserva la posición del paso 3 al hacer scroll y se adapta al móvil", () => {
    cy.get('aside[aria-label="Resumen del cobro"]').should("have.css", "position", "fixed").then(($card) => {
      const top = $card[0].getBoundingClientRect().top;
      cy.get("main").scrollTo("bottom");
      cy.get('aside[aria-label="Resumen del cobro"]').should(($fixed) => {
        expect(Math.abs($fixed[0].getBoundingClientRect().top - top)).to.be.lessThan(1);
      });
      cy.get("main").scrollTo(0, 150);
      cy.get('aside[aria-label="Resumen del cobro"]').should(($fixed) => {
        expect(Math.abs($fixed[0].getBoundingClientRect().top - top)).to.be.lessThan(1);
      });
    });
    cy.get("#descripcion-pago").type("Pago recibido en oficina de la comunidad.");
    cy.screenshot("emision-resumen-fijo-descripcion", { capture: "viewport" });
    cy.viewport(390, 844);
    cy.get('aside[aria-label="Resumen del cobro"]').should("have.css", "position", "static");
    cy.get("#descripcion-pago").scrollIntoView().should("be.visible");
    cy.get("main").should(($main) => expect($main[0].scrollWidth).to.be.at.most($main[0].clientWidth + 1));
  });

  it("envía la descripción opcional para ambos cobros y usa la automática cuando está vacía", () => {
    // Se detienen los POST con una respuesta de prueba: no se registran pagos.
    cy.intercept("POST", "**/api/facturacion/cobrar/*", { statusCode: 503, body: { success: false, message: "Cobro interceptado por la prueba" } }).as("cobro");
    cy.get("#descripcion-pago").should("not.have.attr", "required");
    cy.get("#descripcion-pago").type("  Observación del tesorero.  ");
    cy.contains("button", /^Emitir$/).click();
    cy.wait("@cobro").its("request.body.descripcionPago").should("eq", "Observación del tesorero.");
    cy.contains("button", /^Emitir$/).should("be.enabled");
    cy.get("#descripcion-pago").clear().type("   ");
    cy.contains("button", /^Emitir$/).click();
    cy.wait("@cobro").its("request.body.descripcionPago").should("eq", `Pago tarifa anual ${year} — 2 chorro(s)`);
    cy.contains("button", /^Emitir$/).should("be.enabled");
    cy.contains('[role="radio"]', "Compra de chorro").click();
    cy.get("#descripcion-pago").clear().type("Detalle de la compra.");
    cy.contains("button", /^Emitir$/).click();
    cy.wait("@cobro").then(({ request }) => {
      expect(request.url).to.contain("/compra-chorro");
      expect(request.body.descripcionPago).to.eq("Detalle de la compra.");
    });
  });
});
