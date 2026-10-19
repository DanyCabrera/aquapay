import { defineConfig } from "cypress";

export default defineConfig({
  env: {
    adminDpi: process.env.E2E_ADMIN_DPI,
    adminPassword: process.env.E2E_ADMIN_PASSWORD,
    tesoreroDpi: process.env.E2E_TESORERO_DPI,
    tesoreroPassword: process.env.E2E_TESORERO_PASSWORD,
    apiUrl: process.env.E2E_API_URL ?? "http://localhost:4100",
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 15_000,
  requestTimeout: 20_000,
  responseTimeout: 30_000,
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    specPattern: "cypress/e2e/{admin,tesorero,tesorero-emision,auth-design}.cy.ts",
    supportFile: false,
    testIsolation: true,
  },
});
