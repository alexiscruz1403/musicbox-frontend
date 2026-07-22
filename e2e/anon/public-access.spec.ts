import { test, expect } from "@playwright/test";

// Rutas públicas: cargan sin sesión y NO redirigen a /login. Sin backend — `/` degrada a una
// landing vacía vía catch (page.tsx), y /terms /privacy son estáticas; las de auth son client
// components que no consultan al backend hasta el submit.
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
];

test.describe("public access (anon)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} carga sin redirigir a login`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status() ?? 200).toBeLessThan(400);
      if (route !== "/login") {
        await expect(page).not.toHaveURL(/\/login(\?|$)/);
      }
    });
  }
});
