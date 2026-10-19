/// <reference types="cypress" />

// Las intercepciones observan respuestas reales; no reemplazan el backend.
function loginPorUi() {
  return cy.env(["adminDpi", "adminPassword"]).then((env) => {
    expect(env.adminDpi, "Configure E2E_ADMIN_DPI o adminDpi en cypress.env.json")
      .to.be.a("string").and.match(/^\d{13}$/);
    expect(env.adminPassword, "Configure E2E_ADMIN_PASSWORD o adminPassword")
      .to.be.a("string").and.have.length.at.least(8);

    cy.intercept("POST", "**/api/auth/login").as("loginAdmin");
    cy.visit("/login");
    cy.get('input[name="dpi"]').type(String(env.adminDpi), { log: false });
    cy.get('input[name="password"]').type(String(env.adminPassword), { log: false });
    cy.contains("button", "Iniciar Sesión").click();
    cy.wait("@loginAdmin").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.data.usuario.rol, "La cuenta debe ser ADMIN")
        .to.eq("administrador");
    });
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("h1", "Dashboard").should("be.visible");
  });
}

function loginAdmin() {
  cy.session("administrador", loginPorUi, {
    validate() {
      cy.env(["apiUrl"]).then(({ apiUrl }) => {
        cy.getAllLocalStorage({ log: false }).then((stores) => {
          const origin = new URL(String(Cypress.config("baseUrl"))).origin;
          const token = stores[origin]?.aquapay_token;
          expect(token, "Token de la sesión ADMIN").to.be.a("string");
          cy.request({
            url: `${apiUrl}/api/auth/me`,
            headers: { Authorization: `Bearer ${token}` },
            log: false,
          }).its("body.data.rol").should("eq", "administrador");
        });
      });
    },
  });
}

function respuestaOk(alias: `@${string}`) {
  return cy.wait(alias).then(({ request, response }) => {
    expect(response?.statusCode).to.be.oneOf(request.method === "GET" ? [200, 304] : [200]);
  });
}

describe("ADMIN — autenticación", () => {
  it("valida DPI incompleto y contraseña corta antes de enviar", () => {
    cy.visit("/login");
    cy.get('input[name="dpi"]').type("1234").blur();
    cy.get('input[name="password"]').type("corta", { log: false }).blur();
    cy.contains("El DPI debe tener 13 dígitos.").should("be.visible");
    cy.contains("Mínimo 8 caracteres.").should("be.visible");
    cy.contains("button", "Iniciar Sesión").should("be.disabled");
    cy.location("pathname").should("eq", "/login");
  });

  it("inicia sesión por la interfaz y conserva el rol al recargar", () => {
    loginPorUi();
    cy.intercept("GET", "**/api/auth/me").as("perfil");
    cy.reload();
    cy.wait("@perfil").its("response.body.data.rol").should("eq", "administrador");
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("h2", "Siguientes pasos").should("be.visible");
  });

  it("rechaza una contraseña incorrecta para el DPI del ADMIN", () => {
    cy.env(["adminDpi"]).then(({ adminDpi }) => {
      cy.intercept("POST", "**/api/auth/login").as("loginInvalido");
      cy.visit("/login");
      cy.get('input[name="dpi"]').type(String(adminDpi), { log: false });
      cy.get('input[name="password"]').type("Incorrecta-E2E-Admin-2026!", { log: false });
      cy.contains("button", "Iniciar Sesión").click();
      cy.wait("@loginInvalido").its("response.statusCode").should("eq", 401);
      cy.get('[role="alert"]').should("contain.text", "DPI o contraseña incorrectos.");
      cy.location("pathname").should("eq", "/login");
      cy.window().then((win) => {
        expect(win.localStorage.getItem("aquapay_token")).to.eq(null);
        expect(win.sessionStorage.getItem("aquapay_token")).to.eq(null);
      });
    });
  });

  it("protege las rutas administrativas sin una sesión", () => {
    for (const ruta of ["/dashboard", "/usuarios", "/usuarios/nuevo", "/pagos", "/reportes", "/configuracion"]) {
      cy.visit(ruta);
      cy.location("pathname").should("eq", "/login");
      cy.get('input[name="dpi"]').should("be.visible");
    }
  });

  it("cierra sesión y bloquea el regreso al panel", () => {
    loginPorUi();
    cy.intercept("POST", "**/api/auth/logout").as("logout");
    cy.contains("aside:visible button", /^Salir$/).click();
    respuestaOk("@logout");
    cy.location("pathname").should("eq", "/login");
    cy.window().then((win) => {
      for (const store of [win.localStorage, win.sessionStorage]) {
        expect(store.getItem("aquapay_token")).to.eq(null);
        expect(store.getItem("aquapay_user")).to.eq(null);
      }
    });
    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/login");
  });
});

describe("ADMIN — panel, permisos y gestión", () => {
  let beneficiarioId: string | undefined;
  let cleanupToken: string | null;

  beforeEach(() => {
    beneficiarioId = undefined;
    cleanupToken = null;
    loginAdmin();
  });

  afterEach(() => {
    // También se ejecuta si falla un paso posterior a crear la persona.
    if (beneficiarioId && cleanupToken) {
      cy.env(["apiUrl"]).then(({ apiUrl }) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/api/usuarios/${beneficiarioId}/desactivar`,
          headers: { Authorization: `Bearer ${cleanupToken}` },
          log: false,
        }).its("status").should("eq", 200);
      });
    }
  });

  it("carga las cifras reales y muestra el menú exclusivo del ADMIN", () => {
    cy.intercept("GET", "**/api/facturacion/dashboard").as("dashboard");
    cy.visit("/dashboard");
    cy.wait("@dashboard").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.data.totalUsuarios).to.be.a("number");
    });
    cy.get('aside:visible nav[aria-label="Principal"]').within(() => {
      for (const ruta of ["/dashboard", "/usuarios", "/pagos", "/reportes", "/configuracion"]) {
        cy.get(`a[href="${ruta}"]`).should("be.visible");
      }
      cy.get('a[href="/facturacion"], a[href="/historial"]').should("not.exist");
    });
    cy.get("main").within(() => {
      for (const texto of ["Tarifa anual", "Compra de chorro", "Total cobrado", "Beneficiarios"]) {
        cy.contains(texto).should("be.visible");
      }
    });
    cy.contains("h2", "Estado del padrón").should("exist");
    cy.get('aside:visible').should("contain.text", "Panel administrador");
    cy.screenshot("admin-dashboard-redesign", { capture: "viewport" });
    cy.get("main").contains("a", "Registrar beneficiario").click();
    cy.location("pathname").should("eq", "/usuarios/nuevo");
    cy.get("#nombre").should("be.visible");
  });

  for (const ruta of ["/facturacion", "/facturacion/nuevo", "/historial"]) {
    it(`impide al ADMIN abrir ${ruta}, reservada al tesorero`, () => {
      cy.visit(ruta);
      cy.location("pathname").should("eq", "/dashboard");
      cy.contains("h2", "Siguientes pasos").should("be.visible");
    });
  }

  it("mantiene la identidad ADMIN y la navegación en móvil y tema oscuro", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.contains("h2", "Resumen de la comunidad").should("be.visible");
    cy.get('button[aria-label="Abrir menú"]').click();
    cy.get('div[aria-hidden="false"] aside').should("contain.text", "Panel administrador").within(() => {
      cy.get('a[href="/usuarios"]').click();
    });
    cy.location("pathname").should("eq", "/usuarios");
    cy.get('button[aria-label="Usar tema oscuro"]').click();
    cy.get("html").should("have.class", "dark");
    cy.screenshot("admin-mobile-dark", { capture: "viewport", scale: true });
    cy.get('button[aria-label="Usar tema claro"]').click();
    cy.get("html").should("not.have.class", "dark");
    cy.viewport(1280, 720);
    cy.visit("/usuarios");
    cy.contains("button", "Exportar CSV").should("be.enabled");
    cy.screenshot("admin-beneficiarios-redesign", { capture: "viewport", scale: true });
  });

  it("el backend rechaza operaciones de tesorería con el token ADMIN", () => {
    cy.visit("/dashboard");
    cy.env(["apiUrl"]).then(({ apiUrl }) => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem("aquapay_token");
        for (const [method, ruta] of [
          ["GET", "/api/facturacion/siguiente-recibo"],
          ["POST", "/api/facturacion/cobrar/tarifa-anual"],
          ["POST", "/api/facturacion/cobrar/compra-chorro"],
        ]) {
          cy.request({
            method,
            url: `${apiUrl}${ruta}`,
            headers: { Authorization: `Bearer ${token}` },
            body: method === "POST" ? {} : undefined,
            failOnStatusCode: false,
            log: false,
          }).its("status").should("eq", 403);
        }
      });
    });
  });

  it("registra persona, vivienda y chorro, busca por DPI y cambia su estado", () => {
    const sufijo = `${Date.now()}${Cypress._.random(1000, 9999)}`.slice(-10);
    const dpi = `887${sufijo}`;
    const nombre = `E2E Cypress ADMIN ${sufijo}`;
    const direccion = `Vivienda E2E ADMIN ${sufijo}`;

    cy.visit("/usuarios/nuevo");
    cy.window().then((win) => { cleanupToken = win.localStorage.getItem("aquapay_token"); });
    cy.intercept("POST", "**/api/usuarios").as("crearPersona");
    cy.get("#nombre").type(nombre);
    cy.get("#dpi").type(dpi);
    cy.get("#tel").type("55551234");
    cy.contains("button", /^Continuar$/).click();
    cy.wait("@crearPersona").then(({ response }) => {
      // Guardar el id antes de las aserciones permite limpiar aunque fallen.
      beneficiarioId = response?.body.data?.id;
      expect(response?.statusCode).to.eq(201);
      expect(beneficiarioId).to.be.a("string");
      expect(response?.body.data.dpi).to.eq(dpi);
    });

    cy.intercept("POST", "**/api/usuarios/*/viviendas").as("crearVivienda");
    cy.get("#direccion").type(direccion);
    cy.get("#anio").should("have.value", String(new Date().getFullYear()));
    cy.contains("button", /^Continuar$/).click();
    cy.wait("@crearVivienda").its("response.statusCode").should("eq", 201);

    cy.intercept("POST", "**/api/usuarios/viviendas/*/chorros").as("crearChorro");
    cy.get("#cantidad").should("have.value", "1");
    cy.get("#precio").should("have.attr", "readonly");
    cy.contains("button", /^Finalizar$/).click();
    cy.wait("@crearChorro").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.data.cantidad).to.eq(1);
      expect(Number(response?.body.data.precioCompra)).to.eq(1500);
    });
    cy.then(() => cy.location("pathname").should("eq", `/usuarios/${beneficiarioId}`));
    cy.contains("h2", nombre).should("be.visible");
    cy.contains(direccion).should("be.visible");
    cy.contains("chorro(s)").should("be.visible");
    cy.contains("button", /^Editar datos$/).click();
    cy.get("#editar-telefono").clear().type("55554321");
    cy.intercept("PATCH", "**/api/usuarios/*").as("editarPerfil");
    cy.get('[role="dialog"]').contains("button", /^Guardar cambios$/).click();
    respuestaOk("@editarPerfil");
    cy.reload();
    cy.contains("55554321").should("be.visible");

    cy.contains("a", "Volver a beneficiarios").click();
    cy.intercept("GET", "**/api/usuarios?q=*").as("buscarPersona");
    cy.get('input[aria-label="Buscar beneficiarios"]').type("E2E Cypress ADMIN");
    cy.contains("button", /^Buscar$/).click();
    cy.wait("@buscarPersona").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.data.length).to.be.greaterThan(0);
      expect(response?.body.data.every((u: { nombreCompleto: string }) => u.nombreCompleto.includes("E2E Cypress ADMIN"))).to.eq(true);
    });
    cy.get('input[aria-label="Buscar beneficiarios"]').clear();
    cy.get('input[aria-label="Buscar beneficiarios"]').type(dpi);
    cy.contains("button", /^Buscar$/).click();
    respuestaOk("@buscarPersona");
    cy.get("main").contains("a", nombre).click();
    cy.intercept("POST", "**/api/usuarios/*/desactivar").as("desactivar");
    cy.get('[role="switch"][aria-label="Deshabilitar usuario"]').click();
    cy.get('[role="alertdialog"]').should("contain.text", nombre);
    cy.screenshot("admin-confirmar-desactivacion", { capture: "viewport" });
    cy.get('[role="alertdialog"]').contains("button", /^Cancelar$/).click();
    cy.get('[role="switch"][aria-label="Deshabilitar usuario"]').should("have.attr", "aria-checked", "true").click();
    cy.get('[role="alertdialog"]').contains("button", /^Sí, desactivar$/).click();
    respuestaOk("@desactivar");
    cy.get('[role="switch"][aria-label="Habilitar usuario"]').should("have.attr", "aria-checked", "false");
    cy.reload();
    cy.get('[role="switch"][aria-label="Habilitar usuario"]').should("have.attr", "aria-checked", "false");
    cy.intercept("POST", "**/api/usuarios/*/activar").as("activar");
    cy.get('[role="switch"][aria-label="Habilitar usuario"]').click();
    cy.get('[role="alertdialog"]').contains("button", /^Sí, activar$/).click();
    respuestaOk("@activar");
    cy.get('[role="switch"][aria-label="Deshabilitar usuario"]').should("have.attr", "aria-checked", "true");

    cy.intercept("GET", "**/api/facturacion/recibos?*").as("pagosPersona");
    cy.get("main").contains("a", /^Consultar pago$/).click();
    cy.location("search").should("eq", `?dpi=${dpi}`);
    cy.wait("@pagosPersona").then(({ request, response }) => {
      expect(new URL(request.url).searchParams.get("q")).to.eq(dpi);
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.data).to.deep.eq([]);
    });
    cy.contains("Nadie coincide con esa búsqueda").should("be.visible");

    cy.visit("/usuarios");
    cy.get('input[aria-label="Buscar beneficiarios"]').type(dpi);
    cy.contains("button", /^Buscar$/).click();
    cy.get("main").contains("tr", nombre).within(() => {
      cy.contains("button", /^Eliminar$/).click();
    });
    cy.get('[role="alertdialog"]').should("contain.text", "Esta acción no se puede deshacer.");
    cy.screenshot("admin-confirmar-eliminacion", { capture: "viewport" });
    cy.get('[role="alertdialog"]').contains("button", /^Cancelar$/).click();
    cy.get("main").contains("tr", nombre).should("exist").within(() => {
      cy.contains("button", /^Eliminar$/).click();
    });
    cy.intercept("DELETE", "**/api/usuarios/*").as("eliminarPersona");
    cy.get('[role="alertdialog"]').contains("button", /^Sí, eliminar$/).click();
    cy.wait("@eliminarPersona").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.data.eliminado).to.eq(true);
      const eliminadoId = beneficiarioId;
      beneficiarioId = undefined;
      cy.env(["apiUrl"]).then(({ apiUrl }) => {
        cy.request({
          url: `${apiUrl}/api/usuarios/${eliminadoId}`,
          headers: { Authorization: `Bearer ${cleanupToken}` },
          failOnStatusCode: false,
          log: false,
        }).its("status").should("eq", 404);
      });
    });
    cy.get("main").contains("a", nombre).should("not.exist");
  });

  it("consulta la tarifa real y mantiene el lugar de pago en solo lectura", () => {
    cy.intercept("GET", "**/api/facturacion/config").as("config");
    cy.visit("/configuracion");
    cy.wait("@config").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      cy.get("#tarifa").should("have.value", String(response?.body.data.tarifaAnual));
      cy.get("#lugar").should("have.value", response?.body.data.lugarPago)
        .and("have.attr", "readonly");
    });
    cy.get("#tarifa").should("have.attr", "min", "0.01");
    cy.contains("button", /^Guardar cambios$/).should("be.disabled");
    cy.get("#simulador-chorros").clear().type("2");
    cy.contains("Importe anual estimado").should("be.visible");
    cy.screenshot("admin-tarifa-redesign", { capture: "viewport" });
  });

  it("consulta los cuatro reportes y descarga el PDF de usuarios", () => {
    cy.intercept("GET", "**/api/reportes/usuarios").as("padronInicial");
    cy.visit("/reportes");
    respuestaOk("@padronInicial");
    cy.contains("h2", "Reporte de usuarios registrados").should("be.visible");
    cy.screenshot("admin-reportes-redesign", { capture: "viewport" });
    for (const [tipo, boton, titulo] of [
      ["ingresos", "Ingresos", "Ingresos por mes"],
      ["pagos", "Recibos", "Reporte de pagos"],
      ["viviendas", "Viviendas", "Reporte de viviendas registradas"],
      ["usuarios", "Usuarios", "Reporte de usuarios registrados"],
    ]) {
      cy.intercept("GET", `**/api/reportes/${tipo}*`).as(tipo);
      cy.get("main").contains("button", boton).click();
      respuestaOk(`@${tipo}`);
      cy.contains("h2", titulo).should("be.visible");
      cy.get("main table thead th").should("have.length.at.least", 3);
    }
    cy.intercept("GET", "**/api/reportes/usuarios/pdf*").as("pdfUsuarios");
    cy.contains("button", "Exportar PDF").click();
    cy.wait("@pdfUsuarios").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.headers["content-type"]).to.contain("application/pdf");
    });
    cy.readFile(`${Cypress.config("downloadsFolder")}/reporte-usuarios.pdf`, "binary")
      .should("match", /^%PDF-/);
  });
});
