/// <reference types="cypress" />
export {};
const admin = { id: "qa-admin", nombre: "DANY ABIMAEL CABRERA HERNANDEZ ", rol: "administrador" };
const vivienda = { id: "v-1", direccion: "Dirección original", anioInicioCobro: 2020, activa: true, chorros: [] };
const persona = { id: "qa-persona", nombreCompleto: "Beneficiario QA", dpi: "8880000000888", activo: true, fechaRegistro: "2026-10-20", viviendas: [vivienda, { ...vivienda, id: "v-2", direccion: "Segunda vivienda" }] };
const ok = (data: unknown) => ({ body: { success: true, data } });
function visitar(path: string) {
  cy.visit(path, { onBeforeLoad(win) { win.localStorage.setItem("aquapay_token", "qa-simulado"); win.localStorage.setItem("aquapay_user", JSON.stringify(admin)); } });
}
describe("ADMIN — correcciones del informe QA", () => {
  beforeEach(() => {
    cy.intercept("**/api/**", { statusCode: 503, body: { success: false, message: "Ruta de prueba no simulada" } });
    cy.intercept("GET", "**/api/auth/me", ok(admin));
    cy.intercept("GET", "**/api/usuarios", ok([persona]));
    cy.intercept("GET", "**/api/usuarios/qa-persona", ok(persona));
  });
  it("QA-A01: saluda con el nombre completo y sin espacio antes del punto", () => {
    cy.intercept("GET", "**/api/facturacion/dashboard", ok({ ingresosMes: 0, facturasMes: 0, ingresosPorMes: [], tarifaAnual: 120, totalUsuarios: 1, totalViviendas: 2 }));
    cy.intercept("GET", "**/api/facturacion/recibos?*", ok([]));
    visitar("/dashboard");
    cy.contains("main p", "Hola, DANY ABIMAEL CABRERA HERNANDEZ.").should("be.visible");
  });
  it("QA-A02: captura DPI en grupos, valida 13 dígitos y envía solo números", () => {
    cy.intercept("POST", "**/api/usuarios", { statusCode: 201, ...ok(persona) }).as("crear");
    visitar("/usuarios/nuevo");
    cy.get("#dpi").type("888000000088").should("have.value", "8880 00000 088").then(($input) => expect(($input[0] as HTMLInputElement).checkValidity()).to.eq(false));
    cy.get("#dpi").type("8").should("have.value", "8880 00000 0888");
    cy.get('input[id="nombre"]').type("Beneficiario QA");
    cy.contains("button", "Continuar").click();
    cy.wait("@crear").its("request.body.dpi").should("eq", "8880000000888");
    cy.contains("h2", "Información de la vivienda").should("be.visible");
  });
  it("QA-A03: formatea el DPI del reporte y permite buscarlo con espacios", () => {
    cy.intercept("GET", "**/api/reportes/usuarios", ok({ titulo: "Usuarios", columnas: ["DPI", "Nombre", "Teléfono", "Estado"], filas: [[persona.dpi, persona.nombreCompleto, "55559999", "Activo"]] }));
    visitar("/reportes");
    cy.get("tbody").should("contain.text", "8880 00000 0888");
    cy.get('[aria-label="Buscar en el reporte"]').type("8880 00000 0888");
    cy.get("tbody").should("contain.text", persona.nombreCompleto);
  });
  it("QA-A05: actualiza solo la dirección elegida y persiste al recargar", () => {
    let nuevaDireccion = vivienda.direccion;
    cy.intercept("GET", "**/api/usuarios/qa-persona", (req) => req.reply(ok({ ...persona, viviendas: [{ ...vivienda, direccion: nuevaDireccion }, persona.viviendas[1]] })));
    cy.intercept("PATCH", "**/api/usuarios/viviendas/v-1", (req) => {
      expect(req.body).to.deep.eq({ direccion: "Dirección corregida" });
      nuevaDireccion = req.body.direccion;
      req.reply(ok({ ...vivienda, direccion: nuevaDireccion }));
    }).as("editar");
    visitar("/usuarios/qa-persona");
    cy.contains("button", "Editar dirección").click();
    cy.get("#editar-direccion").clear().type("  ");
    cy.contains("button", "Guardar dirección").should("be.disabled");
    cy.get("#editar-direccion").clear().type("  Dirección corregida  ");
    cy.contains("button", "Guardar dirección").click();
    cy.wait("@editar");
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("p", "Dirección corregida").should("be.visible");
    cy.reload();
    cy.contains("p", "Dirección corregida").should("be.visible");
    cy.contains("p", "Segunda vivienda").should("exist");
    cy.contains("Cobro desde 2020").should("exist");
  });
  it("QA-A05: conserva la dirección escrita si falla y permite cancelar", () => {
    cy.intercept("PATCH", "**/api/usuarios/viviendas/v-1", { statusCode: 503, body: { success: false, message: "No se pudo guardar" } }).as("fallo");
    visitar("/usuarios/qa-persona");
    cy.contains("button", "Editar dirección").click();
    cy.get("#editar-direccion").clear().type("Dirección pendiente");
    cy.contains("button", "Guardar dirección").click();
    cy.wait("@fallo");
    cy.get('[role="dialog"] [role="alert"]').should("contain.text", "No se pudo guardar");
    cy.get("#editar-direccion").should("have.value", "Dirección pendiente");
    cy.contains("button", "Cancelar").click();
    cy.contains("p", "Dirección original").should("be.visible");
  });
  it("QA-A04: usa chorro en singular y chorros en plural", () => {
    cy.intercept("GET", "**/api/facturacion/config", ok({ tarifaAnual: 120, lugarPago: "Aldea Sibaná" }));
    visitar("/configuracion");
    cy.contains("1 chorro × Q 120.00 / año").should("be.visible");
    cy.get("#simulador-chorros").clear().type("2");
    cy.contains("2 chorros × Q 120.00 / año").should("be.visible");
  });
  for (const width of [390, 1280]) {
    it(`presenta los módulos limpios a ${width}px en ambos temas`, () => {
      cy.viewport(width, 844);
      cy.intercept("GET", "**/api/facturacion/dashboard", ok({ ingresosMes: 0, facturasMes: 0, ingresosPorMes: [], tarifaAnual: 120, totalUsuarios: 1, totalViviendas: 2, totalChorros: 0 }));
      cy.intercept("GET", "**/api/facturacion/recibos?*", ok([]));
      cy.intercept("GET", "**/api/reportes/usuarios", ok({ titulo: "Usuarios", columnas: ["DPI", "Nombre", "Estado"], filas: [[persona.dpi, persona.nombreCompleto, "Activo"]] }));
      cy.intercept("GET", "**/api/facturacion/config", ok({ tarifaAnual: 120, lugarPago: "Aldea Sibaná" }));
      for (const path of ["/dashboard", "/usuarios", "/usuarios/nuevo", "/usuarios/qa-persona", "/pagos", "/reportes", "/configuracion"]) {
        visitar(path);
        cy.get("main h2").should("exist");
        cy.get("main").should("not.contain.text", "Cómo consultar un pago").and("not.contain.text", "información importante").and("not.contain.text", "Siguientes pasos");
        for (const theme of ["claro", "oscuro"]) {
          cy.get("html").then(($html) => {
            if ($html.hasClass("dark") !== (theme === "oscuro")) cy.get(`[aria-label="Usar tema ${theme}"]`).click();
          });
          cy.get("main").should(($main) => expect($main[0].scrollWidth).to.be.at.most($main[0].clientWidth + 1));
        }
        if (path === "/usuarios/nuevo" || path === "/reportes") cy.screenshot(`admin-limpio-${path.split("/").pop()}-${width}`, { capture: "viewport", scale: true });
      }
    });
  }

});
