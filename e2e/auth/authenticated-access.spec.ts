import { test, expect } from "@playwright/test";
import { mockBackend } from "../fixtures/mock-api";

// Corren con la cookie de sesión firmada por auth.setup.ts (storageState del project
// "authenticated"). Prueban que la cookie minted es aceptada por auth() y el comportamiento
// autenticado del proxy. El backend se mockea a nivel del navegador; el render server-side de
// estas páginas solo necesita la cookie.
test.describe("authenticated access", () => {
  test("con sesión, /feed no redirige a /login", async ({ page }) => {
    await mockBackend(page, { "/feed": { data: [], meta: { cursor: null } } });
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("con sesión, /login redirige a /feed (AUTH_ONLY del proxy)", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("con sesión, /settings es accesible", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);
  });
});
