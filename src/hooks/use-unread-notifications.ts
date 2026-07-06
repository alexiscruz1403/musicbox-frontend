"use client";

import { useQuery } from "@tanstack/react-query";
import { apiNotifications } from "@/lib/api";

// El backend no expone un conteo total de no leídas — solo un listado
// paginado filtrable. Esta es una "espiada" (limit chico) para el punto/badge
// de la campana y de la tab "No leídas", no un conteo exacto global.
const UNREAD_PEEK_LIMIT = 20;

// Compartida por NotificationBell y NotificationsPanel: al usar la misma
// queryKey, TanStack Query dedupea ambos consumidores en un solo request.
export function useUnreadNotifications(accessToken: string | null) {
  return useQuery({
    queryKey: ["notifications", "unread-flag"],
    queryFn: () =>
      apiNotifications(accessToken as string, {
        unreadOnly: true,
        limit: UNREAD_PEEK_LIMIT,
      }),
    enabled: !!accessToken,
    staleTime: 30 * 1000,
  });
}

export { UNREAD_PEEK_LIMIT };
