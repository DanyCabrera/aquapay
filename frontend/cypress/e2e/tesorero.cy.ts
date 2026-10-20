/// <reference types="cypress" />
export {};

function loginTesorero() {
  cy.session("tesorero-redesign", () => {
    cy.env(["tesoreroDpi", "tesoreroPassword"]).then((env) => {
      expect(env.tesoreroDpi, "DPI TESORERO configurado").to.be.a("string");
      cy.intercept("POST", "**/api/auth/login").as("login");
      cy.visit("/login");
      cy.get('input[name="dpi"]').type(String(env.tesoreroDpi), { log: false });
      cy.get('input[name="password"]').type(String(env.tesoreroPassword), { log: false });
      cy.contains("button", "Iniciar Sesión").click();
      cy.wait("@login").its("response.body.data.usuario.rol").should("eq", "tesorero");
      cy.location("pathname", { timeout: 60_000 }).should("eq", "/dashboard");
      cy.contains("h2", "Resumen de tesorería").should("be.visible");
    });
  });
}
function noOverflow() {
  cy.get("main").should(($main) => {
    expect($main[0].scrollWidth, "ancho de contenido").to.be.at.most($main[0].clientWidth + 1);
  });
}
const fixtureRecibos = Array.from({ length: 14 }, (_, i) => ({
  id: `demo-${i}`, numeroRecibo: `2026-${String(i + 1).padStart(3, "0")}`,
  tipoCobro: i % 2 ? "compra_chorro" : "tarifa_anual", totalPagado: i % 2 ? "1500" : "200",
  fechaPago: "2026-10-18", cantidadEnLetras: "", descripcionPago: "Datos exclusivos de prueba visual",
  vivienda: { direccion: "Sector El Centro", usuario: { nombreCompleto: `Beneficiario visual ${i + 1}`, dpi: "9902600000001" } },
}));

describe("TESORERO — rediseño", () => {
  beforeEach(() => loginTesorero());

  it("muestra identidad, indicadores y módulos con datos reales", () => {
    cy.intercept("GET", "**/api/facturacion/dashboard").as("resumen");
    cy.visit("/dashboard");
    cy.wait("@resumen").its("response.statusCode").should("be.oneOf", [200, 304]);
    cy.get('button[aria-label="Actualizar resumen"]').should("be.enabled");
    cy.get('main [role="alert"]').should("not.exist");
    cy.contains("aside:visible", "Tesorero · AquaPay").should("be.visible");
    for (const title of ["Evolución de ingresos", "Servicio de agua", "Últimos recibos"]) cy.contains("h2", title).should("exist");
    cy.get('aside:visible a[href="/usuarios"]').should("not.exist");
    noOverflow();
    cy.screenshot("tesorero-dashboard-desktop", { capture: "viewport" });
  });

  for (const [width, height] of [[360, 800], [768, 1024], [1280, 800]]) {
    it(`adapta los tres módulos a ${width}px sin desbordamiento`, () => {
      cy.viewport(width, height);
      for (const path of ["/dashboard", "/facturacion", "/historial"]) {
        cy.visit(path);
        cy.get("main h2").should("exist");
        noOverflow();
      }
      if (width < 1024) {
        cy.get('button[aria-label="Abrir menú"]').click();
        cy.get('aside:visible nav a[href="/dashboard"]').click();
        cy.location("pathname").should("eq", "/dashboard");
        cy.get('[aria-hidden="true"] > aside').parent().should("have.attr", "inert");
      }
      if (width === 360) {
        cy.get('button[aria-label="Actualizar resumen"]').should("be.enabled");
        cy.screenshot("tesorero-dashboard-mobile", { capture: "viewport", scale: true });
      }
    });
  }

  it("consulta beneficiarios y pendientes reales sin emitir cobros", () => {
    cy.intercept("GET", "**/api/usuarios").as("beneficiarios");
    cy.intercept("GET", "**/api/facturacion/pendientes/*").as("pendientes");
    cy.visit("/facturacion");
    cy.wait("@beneficiarios");
    cy.contains("button", /^Emitir$/).should("be.disabled");
    cy.get("#buscar").type("NombreInexistenteSinNumeros");
    cy.get('select[aria-label="Beneficiario"] option').should("have.length", 1);
    cy.contains("0 beneficiarios activos encontrados").should("be.visible");
    cy.get("#buscar").clear();
    cy.get('select[aria-label="Beneficiario"] option').then(($options) => {
      const value = $options.eq(1).val();
      cy.get('select[aria-label="Beneficiario"]').select(String(value));
    });
    cy.wait("@pendientes").its("response.statusCode").should("eq", 200);
    cy.contains("h2", "Resumen del cobro").should("exist");
    cy.get("aside.admin-surface").should("not.contain.text", "Por seleccionar");
    cy.contains('[role="radio"]', "Compra de chorro").click().should("have.attr", "aria-checked", "true");
    noOverflow();
    cy.screenshot("tesorero-emision-desktop", { capture: "viewport" });
  });

  it("distingue errores de red y permite reintentar el historial", () => {
    let fallar = true;
    cy.intercept("GET", "**/api/facturacion/recibos?*", (req) => {
      req.reply(fallar ? { statusCode: 503, body: { success: false, message: "Servicio temporalmente no disponible" } } : { statusCode: 200, body: { success: true, data: [] } });
    }).as("historial");
    cy.visit("/historial"); cy.wait("@historial");
    cy.get('main [role="alert"]').should("be.visible");
    cy.contains("Sin recibos registrados").should("not.exist");
    cy.then(() => { fallar = false; });
    cy.contains("button", "Reintentar").click(); cy.wait("@historial");
    cy.contains("Sin recibos registrados").should("be.visible");
    cy.contains("button", "Exportar CSV").should("be.disabled");
  });

  it("filtra, pagina y exporta recibos con fixtures sin escribir pagos", () => {
    cy.intercept("GET", "**/api/facturacion/recibos?*", { body: { success: true, data: fixtureRecibos } }).as("listado");
    cy.visit("/historial"); cy.wait("@listado");
    cy.contains("Mostrando 1–12 de 14").should("be.visible");
    cy.contains("button", "Siguiente").click();
    cy.contains("Mostrando 13–14 de 14").should("be.visible");
    cy.get('select[aria-label="Concepto de pago"]').select("compra_chorro");
    cy.contains("Mostrando 1–7 de 7").should("be.visible");
    cy.get("tbody tr").should("have.length", 7);
    cy.contains("button", "Exportar CSV").click();
    cy.readFile("cypress/downloads/recibos-todos.csv").should("contain", "Beneficiario visual").and("contain", "Compra de chorro");
    cy.viewport(360, 800);
    cy.get("article").should("have.length", 7).first().should("be.visible");
    cy.get("table").should("not.be.visible"); noOverflow();
    cy.screenshot("tesorero-historial-mobile", { capture: "viewport", scale: true });
  });

  it("mantiene fondos blancos y negros y carga el logo", () => {
    cy.visit("/dashboard");
    cy.get('button[aria-label="Actualizar resumen"]').should("be.enabled");
    cy.get("html").then(($html) => { if ($html.hasClass("dark")) cy.get('[aria-label="Usar tema claro"]').click(); });
    cy.get("main").should("have.css", "background-color", "rgb(255, 255, 255)");
    cy.get("header").should("have.css", "background-color", "rgb(255, 255, 255)");
    cy.get('aside:visible img').should(($img) => { expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.get('[aria-label="Usar tema oscuro"]').click();
    cy.get("main").should("have.css", "background-color", "rgb(0, 0, 0)");
    cy.get("header").should("have.css", "background-color", "rgb(0, 0, 0)");
    cy.screenshot("tesorero-dashboard-dark", { capture: "viewport" });
  });
});
