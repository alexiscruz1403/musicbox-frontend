import type {
  ApiSuccessResponse,
  VapidPublicKeyResponse,
  PushSubscriptionPayload,
} from "@/types/api";
import { apiFetch } from "./client";

// Web Push (Fase 8)

export async function apiGetVapidPublicKey(): Promise<
  ApiSuccessResponse<VapidPublicKeyResponse>
> {
  return apiFetch<ApiSuccessResponse<VapidPublicKeyResponse>>(
    "/push/vapid-public-key",
  );
}

export async function apiSubscribePush(
  accessToken: string,
  subscription: PushSubscriptionPayload,
): Promise<void> {
  return apiFetch<void>("/push/subscriptions", {
    method: "POST",
    accessToken,
    body: JSON.stringify(subscription),
  });
}

export async function apiUnsubscribePush(
  accessToken: string,
  endpoint: string,
): Promise<void> {
  return apiFetch<void>(
    `/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}
