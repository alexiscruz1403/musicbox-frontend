"use client";

import { useEffect } from "react";

// Registra public/sw.js una sola vez por sesión de navegador. El propio SW
// hace skipWaiting()/clients.claim() en su install/activate, así que no hace
// falta un flujo de "hay una versión nueva, recargá" acá.
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registro best-effort — si falla (browser sin soporte, contexto no
      // seguro, etc.) la app sigue funcionando normalmente sin PWA/push.
    });
  }, []);

  return null;
}
