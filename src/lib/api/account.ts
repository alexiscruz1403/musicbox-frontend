import type {
  ApiSuccessResponse,
  ExportDataResponse,
  NotificationPreferences,
  NotificationPrefsUpdate,
} from "@/types/api";
import { apiFetch } from "./client";

// Legal / cuenta (Fase 7) + preferencias de notificación (Fase 1)

export async function apiExportUserData(
  accessToken: string,
): Promise<ApiSuccessResponse<ExportDataResponse>> {
  return apiFetch<ApiSuccessResponse<ExportDataResponse>>("/users/me/export", {
    accessToken,
  });
}

export async function apiDeleteMe(accessToken: string): Promise<void> {
  return apiFetch<void>("/users/me", {
    method: "DELETE",
    accessToken,
  });
}

export async function apiGetNotificationPrefs(
  accessToken: string,
): Promise<ApiSuccessResponse<NotificationPreferences>> {
  return apiFetch<ApiSuccessResponse<NotificationPreferences>>(
    "/users/me/notifications-prefs",
    { accessToken },
  );
}

export async function apiUpdateNotificationPrefs(
  accessToken: string,
  updates: NotificationPrefsUpdate,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<NotificationPreferences>> {
  return apiFetch<ApiSuccessResponse<NotificationPreferences>>(
    "/users/me/notifications-prefs",
    {
      method: "PATCH",
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(updates),
    },
  );
}
