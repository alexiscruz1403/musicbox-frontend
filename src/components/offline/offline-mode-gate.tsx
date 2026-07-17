"use client";

import { useEffect, type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { refreshRecentlyViewedCache } from "@/lib/offline/recently-viewed-cache";
import { refreshProfileCache } from "@/lib/offline/profile-cache";
import { flushMutationQueue } from "@/lib/offline/sync-manager";
import { OfflineHome } from "./offline-home";

interface OfflineModeGateProps {
  accessToken: string | null;
  children: ReactNode;
}

// Montado en (main)/layout.tsx envolviendo el <main> normal. Mientras hay
// conexión, refresca los caches de IndexedDB (recientes, perfil, prefs) y
// vacía la cola de mutaciones pendientes en segundo plano. En cuanto se
// detecta navigator.onLine === false, reemplaza el contenido normal por la
// vista offline dedicada (ver docs del plan: las rutas reales son Server
// Components y no pueden re-renderizarse sin servidor).
export function OfflineModeGate({ accessToken, children }: OfflineModeGateProps) {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline || !accessToken) return;
    void refreshRecentlyViewedCache(accessToken);
    void refreshProfileCache(accessToken);
    void flushMutationQueue(accessToken);
  }, [isOnline, accessToken]);

  if (isOnline) {
    return <>{children}</>;
  }

  if (!accessToken) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-mb-muted text-sm">
        Sin conexión. Iniciá sesión cuando vuelva la conexión para acceder al
        modo offline.
      </div>
    );
  }

  return <OfflineHome accessToken={accessToken} />;
}
