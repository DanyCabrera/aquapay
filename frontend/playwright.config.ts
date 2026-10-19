import { defineConfig, devices } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL ?? "http://localhost:4100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tesorero",
      testIgnore: [/auth\.spec\.ts/, /auth\.setup\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/tesorero.json",
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      url: `${apiUrl}/api/auth/registro-opciones`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { PORT: "4100" },
    },
    {
      command: "npm run dev",
      cwd: ".",
      url: "http://localhost:3000/login",
      reuseExistingServer: true,
      timeout: 120_000,
      env: { NEXT_PUBLIC_API_URL: apiUrl },
    },
  ],
});
