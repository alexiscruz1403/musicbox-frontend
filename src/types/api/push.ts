// ─── Web Push (Fase 8) ──────────────────────────────────────────────────────

export interface VapidPublicKeyResponse {
  publicKey: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
