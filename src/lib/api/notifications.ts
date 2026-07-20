import type {
  ApiSuccessResponse,
  NotificationRow,
  NotificationsResponse,
} from "@/types/api";
import { apiFetch, type RawListEnvelope } from "./client";

// Notifications (Fase 5)

export async function apiNotifications(
  accessToken: string,
  options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {},
): Promise<ApiSuccessResponse<NotificationsResponse>> {
  const { cursor, limit = 20, unreadOnly = false } = options;
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (unreadOnly) params.set("unreadOnly", "true");
  const raw = await apiFetch<RawListEnvelope<NotificationRow>>(
    `/notifications?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiMarkNotificationRead(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, {
    method: "PATCH",
    accessToken,
  });
}

export async function apiMarkAllNotificationsRead(
  accessToken: string,
): Promise<void> {
  return apiFetch<void>("/notifications/read-all", {
    method: "POST",
    accessToken,
  });
}
