import { test, expect } from "@playwright/test";

// Sin sesión, TODA ruta autenticada redirige a /login. Valida a la vez el proxy (/settings,
// /admin) y los guards a nivel de página (/feed, /recommendations, review/new) — es la prueba
// automatizada de la matriz de route-protection de Fase 10 (ver la guía del frontend). Sin backend:
// todos los guards cortan con auth() antes de cualquier fetch al catálogo.
const PROTECTED_ROUTES = [
  "/settings",
  "/settings/account",
  "/settings/notifications",
  "/settings/profile",
  "/admin/reports",
  "/feed",
  "/recommendations",
  "/album/123/review/new",
  "/track/123/review/new",
];

test.describe("route protection (anon)", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirige a /login sin sesión`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(\?|$)/);
    });
  }
});
