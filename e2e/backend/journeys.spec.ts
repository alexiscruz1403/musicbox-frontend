import { test, expect } from "@playwright/test";

// Tier 2 — journeys completos contra un musicbox-api REAL. Se saltan por defecto.
// Correr con: E2E_BACKEND=1, NEXT_PUBLIC_API_URL apuntando al backend con datos de seed, y
// E2E_USER_EMAIL / E2E_USER_PASSWORD de un usuario de prueba. Los selectores son best-effort:
// ajustarlos al correrlos por primera vez con el backend levantado. Ver e2e/README.md.
test.describe("journeys (requiere backend) @backend", () => {
  test.skip(
    !process.env.E2E_BACKEND,
    "Seteá E2E_BACKEND=1 + un musicbox-api con seed para correr estos tests.",
  );

  test("login con credenciales lleva al feed", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? "");
    await page
      .getByLabel(/contraseña|password/i)
      .fill(process.env.E2E_USER_PASSWORD ?? "");
    await page.getByRole("button", { name: /ingresar|iniciar|log ?in/i }).click();
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("buscar en el catálogo muestra resultados", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("searchbox").or(page.getByRole("textbox")).first().fill("Radiohead");
    await expect(page.getByText(/Radiohead/i).first()).toBeVisible();
  });
});
