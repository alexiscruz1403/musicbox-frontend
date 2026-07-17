import { apiGetVapidPublicKey, apiSubscribePush, apiUnsubscribePush } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export function getCurrentPushPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// Suscribe este navegador a Web Push y lo registra en el backend
// (POST /v1/push/subscriptions). No pide permiso — eso lo hace
// requestPushPermissionAndSubscribe(), disparado solo por una acción
// explícita del usuario (el toggle en /settings/notifications).
export async function subscribeToPush(accessToken: string): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await apiGetVapidPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
    });
  }
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await apiSubscribePush(accessToken, {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
}

export async function unsubscribeFromPush(accessToken: string): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await apiUnsubscribePush(accessToken, endpoint);
}

// Único punto donde se llama Notification.requestPermission() — siempre en
// respuesta directa a un click del usuario, nunca automático al cargar la app.
export async function requestPushPermissionAndSubscribe(
  accessToken: string,
): Promise<boolean> {
  if (!isPushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  await subscribeToPush(accessToken);
  return true;
}
