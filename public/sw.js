// Service worker a mano (sin Workbox/next-pwa) — mismo criterio que el resto
// del proyecto de evitar dependencias cuando la superficie necesaria es chica
// y predecible (ver src/hooks/use-notifications-stream.ts para el mismo
// criterio aplicado a SSE). Responsabilidades: habilitar la instalación como
// PWA (requiere un SW registrado) y manejar Web Push (push/notificationclick).
// El modo offline en sí vive 100% en IndexedDB + componentes cliente
// (src/lib/offline/, src/components/offline/) — este archivo no intercepta
// fetch ni cachea rutas.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Replica getNotificationText/notificationHref de src/lib/notification-format.ts.
// No se puede importar ese módulo TS directamente acá (este archivo se sirve
// estático, sin paso de build) — si se cambia el copy allá, actualizar acá.
function notificationText(row) {
  const grouped = row.actorCount != null && row.actorCount >= 2;
  const others = grouped ? row.actorCount - 1 : 0;
  const target = row.review ? ` de ${row.review.externalTitle}` : " tu reseña";

  switch (row.type) {
    case "LIKE":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más le dieron like a tu reseña${target}`
        : `le gustó tu reseña${target}`;
    case "DISLIKE":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más reaccionaron a tu reseña${target}`
        : `no le gustó tu reseña${target}`;
    case "COMMENT":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más comentaron en tu reseña${target}`
        : `comentó en tu reseña${target}`;
    case "FOLLOW":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más empezaron a seguirte`
        : "empezó a seguirte";
    case "MODERATION":
      return row.review
        ? "Tu reseña fue ocultada por moderación."
        : "Tu contenido fue ocultado por moderación.";
    case "FOLLOW_REQUEST":
      return "quiere seguirte";
    case "FOLLOW_REQUEST_ACCEPTED":
      return "aceptó tu solicitud de seguimiento";
    default:
      return "Tenés una notificación nueva.";
  }
}

function notificationUrl(row) {
  if (
    (row.type === "FOLLOW" ||
      row.type === "FOLLOW_REQUEST" ||
      row.type === "FOLLOW_REQUEST_ACCEPTED") &&
    row.actor
  ) {
    return `/u/${row.actor.handle}`;
  }
  if (row.review) return `/reviews/${row.review.id}`;
  if (row.actor) return `/u/${row.actor.handle}`;
  return "/feed";
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let row;
  try {
    row = event.data.json();
  } catch {
    return;
  }

  const title = row.actor ? row.actor.displayName : "Vinlyst";
  const body = notificationText(row);
  const url = notificationUrl(row);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/feed";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsList) => {
        for (const client of clientsList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
