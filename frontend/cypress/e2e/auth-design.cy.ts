/// <reference types="cypress" />
export {};

function prepararTema() {
  // La interacción y su resultado confirman que React ya está listo antes de
  // que la captura fullPage modifique temporalmente el overflow del body.
  cy.get("html").then(($html) => {
    const dark = $html.hasClass("dark");
    cy.get(`[aria-label="Usar tema ${dark ? "claro" : "oscuro"}"]`).click();
    cy.get("html").should(dark ? "not.have.class" : "have.class", "dark");
  });
}

describe("Acceso — diseño y formularios", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/auth/registro-opciones", { body: { success: true, data: { permitirAdministrador: false } } });
  });

  it("presenta login y registro con el logo y ambos temas", () => {
    for (const path of ["/login", "/registro"]) {
      const errors: string[] = [];
      cy.visit(path, { onBeforeLoad(win) {
        const original = win.console.error;
        win.console.error = (...args: unknown[]) => { errors.push(args.map(String).join(" ")); original.apply(win.console, args); };
      } });
      prepararTema();
      cy.get("html").then(($html) => { if ($html.hasClass("dark")) cy.get('[aria-label="Usar tema claro"]').click(); });
      cy.get("main").should("have.css", "background-color", "rgb(255, 255, 255)");
      cy.get('section[aria-label="Acerca de AquaPay"]').should("be.visible");
      cy.get("header img").should(($img) => expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0));
      cy.then(() => expect(errors, errors.join("\n")).to.deep.eq([]));
      cy.screenshot(`${path.slice(1)}-redesign-light`, { capture: "fullPage" });
      cy.get('[aria-label="Usar tema oscuro"]').click();
      cy.get("main").should("have.css", "background-color", "rgb(0, 0, 0)");
      cy.screenshot(`${path.slice(1)}-redesign-dark`, { capture: "fullPage" });
    }
  });

  for (const width of [360, 768, 1280]) {
    it(`mantiene los formularios utilizables a ${width}px`, () => {
      cy.viewport(width, 844);
      for (const path of ["/login", "/registro"]) {
        cy.visit(path);
        prepararTema();
        cy.get("h1").should("be.visible");
        cy.get("body").should(($body) => expect($body[0].scrollWidth).to.be.at.most(width));
        cy.get('button[type="submit"]').scrollIntoView().should("be.visible");
        if (width < 1024) cy.get('section[aria-label="Acerca de AquaPay"]').should("not.be.visible");
        if (width === 360) cy.screenshot(`${path.slice(1)}-redesign-mobile`, { capture: "fullPage", scale: true });
      }
    });
  }

  it("conserva las validaciones, visibilidad de contraseña y navegación", () => {
    cy.visit("/login");
    cy.get('input[name="dpi"]').type("1234").blur();
    cy.get('input[name="password"]').type("corta", { log: false }).blur();
    cy.contains("El DPI debe tener 13 dígitos.").should("be.visible");
    cy.contains("Mínimo 8 caracteres.").should("be.visible");
    cy.get('[aria-label="Mostrar contraseña"]').click();
    cy.get('input[name="password"]').should("have.attr", "type", "text");
    cy.get('[aria-label="Ocultar contraseña"]').click();
    cy.contains("button", "¿Olvidó la contraseña?").click();
    cy.contains("h1", "Restablecer").should("be.visible");
    cy.contains("button", "Volver a entrar").click();
    cy.contains("h1", "Inicia sesión").should("be.visible");
    cy.contains("a", "Crear cuenta").click();
    cy.location("pathname").should("eq", "/registro");
    cy.get('input[name="nombre"]').type("A").blur();
    cy.contains("Mínimo 3 caracteres.").should("be.visible");
    cy.get('input[name="dpi"]').type("123").blur();
    cy.contains("El DPI debe tener 13 dígitos.").should("be.visible");
    cy.get('button[type="submit"]').should("be.disabled");
    cy.get('[role="radiogroup"]').should("not.exist");
    cy.contains("a", "Iniciar Sesión").click();
    cy.location("pathname").should("eq", "/login");
  });

  it("permite iniciar sesión real como tesorero desde el nuevo diseño", () => {
    cy.env(["tesoreroDpi", "tesoreroPassword"]).then((env) => {
      cy.visit("/login");
      cy.get('input[name="dpi"]').type(String(env.tesoreroDpi), { log: false });
      cy.get('input[name="password"]').type(String(env.tesoreroPassword), { log: false });
      cy.contains("button", "Iniciar Sesión").click();
      cy.location("pathname", { timeout: 60_000 }).should("eq", "/dashboard");
      cy.contains("h2", "Tu centro de cobros").should("be.visible");
    });
  });
});
