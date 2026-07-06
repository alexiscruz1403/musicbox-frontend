"use client";

import { useNotificationsStream } from "@/hooks/use-notifications-stream";
import { NotificationsPanel } from "./notifications-panel";

interface NotificationsProviderProps {
  accessToken: string | null;
}

// Mantiene viva la conexión SSE mientras haya sesión y monta el panel overlay
// (oculto por defecto, controlado por src/stores/notifications-panel-store.ts)
// una sola vez a nivel de layout, para que sea accesible desde cualquier página.
export function NotificationsProvider({ accessToken }: NotificationsProviderProps) {
  useNotificationsStream(accessToken);
  return <NotificationsPanel accessToken={accessToken} />;
}
