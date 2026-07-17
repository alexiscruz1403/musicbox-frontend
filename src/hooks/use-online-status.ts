"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  // Node 21+ expone un `navigator` global mínimo (solo para navigator.userAgent),
  // así que `typeof navigator === "undefined"` ya no alcanza para detectar SSR
  // — `navigator.onLine` da `undefined` (falsy) ahí y el server renderiza como
  // si estuviera offline, mientras el browser real sí tiene `navigator.onLine`.
  // `window` sigue sin existir en SSR, así que es el chequeo correcto.
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
