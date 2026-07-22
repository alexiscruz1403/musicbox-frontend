import type { Page } from "@playwright/test";

// Mockea el backend a nivel de red DEL NAVEGADOR (page.route). Intercepta solo los fetch del
// cliente — NO los fetch server-side de Next (auth(), Server Components). Por eso los flujos
// autenticados de Tier 1 apuntan a páginas cuyo render server-side solo necesita la cookie de
// sesión, y todo lo que consultan es client-side. Ver e2e/README.md.
//
// `handlers` mapea un fragmento de pathname → body JSON. Lo no mapeado cae a un envelope de lista
// vacía, suficiente para que la mayoría de los listados rendericen su empty-state sin romper.
export async function mockBackend(
  page: Page,
  handlers: Record<string, unknown> = {},
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    // SSE de notificaciones: cortar en seco para no dejar el stream reconectando en loop.
    if (pathname.includes("/notifications/stream")) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    const key = Object.keys(handlers).find((k) => pathname.includes(k));
    if (key) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(handlers[key]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { items: [], nextCursor: null },
        meta: { cursor: null },
      }),
    });
  });
}
