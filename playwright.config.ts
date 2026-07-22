import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/constants";

// Fase 10 — E2E de flujos críticos. Ver e2e/README.md.
// baseURL apunta al dev server local; si se setea E2E_BASE_URL se usa un server externo
// (y no se levanta webServer).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Firma una cookie de sesión NextAuth y la guarda como storageState.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Tier 1 sin sesión: route protection, acceso público. Sin backend.
    {
      name: "anon",
      testMatch: /anon\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Tier 1 autenticado (cookie firmada + API mockeada). Sin backend.
    {
      name: "authenticated",
      testMatch: /auth\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
    // Tier 2: journeys contra un musicbox-api real. Se saltan salvo E2E_BACKEND=1.
    {
      name: "backend",
      testMatch: /backend\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
