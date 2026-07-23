"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { getCurrentPushPermission, subscribeToPush } from "@/lib/push";

interface PushSubscribeProps {
  accessToken: string | null;
}

// No pide permiso nunca (eso solo pasa desde el toggle explícito en
// /settings/notifications, ver requestPushPermissionAndSubscribe). Esto solo
// resincroniza una suscripción cuando el permiso ya estaba concedido de antes
// (por ejemplo, se perdió la suscripción del browser o cambió el device pero
// el permiso del sistema operativo sigue en "granted").
export function PushSubscribe({ accessToken }: PushSubscribeProps) {
  useEffect(() => {
    if (!accessToken) return;
    if (getCurrentPushPermission() !== "granted") return;
    // Resincronización best-effort — el fallo se reporta, no se propaga como
    // unhandledRejection (ver el mismo criterio en offline-mode-gate.tsx).
    subscribeToPush(accessToken).catch((err) => Sentry.captureException(err));
  }, [accessToken]);

  return null;
}
