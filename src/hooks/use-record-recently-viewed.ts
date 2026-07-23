"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";
import { apiCatalogRecordView } from "@/lib/api";
import type { CatalogResourceType } from "@/types/api";

// Registra la visita a un detalle de catálogo con un POST explícito, en lugar
// del efecto secundario que el backend hacía sobre el GET. Como los efectos no
// corren durante un prefetch RSC de Next (que solo renderiza server
// components), esto dispara únicamente en una visita real del cliente — el
// prefetch de los <Link> deja de contar como vista, y generateMetadata + page
// dejan de registrar dos veces.
export function useRecordRecentlyViewed(
  resourceType: CatalogResourceType,
  deezerId: string,
): void {
  const { data: session, status } = useSession();
  // useSession es la fuente confiable del token: en un hard-load, tokenStore se
  // puebla en un efecto de SessionSync cuyo orden respecto a este montaje no
  // está garantizado.
  const accessToken = session?.accessToken;
  // Recuerda el último recurso registrado para no re-disparar en StrictMode
  // (doble montaje en dev) ni en re-renders con el mismo deezerId.
  const recordedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    if (recordedFor.current === deezerId) return;
    recordedFor.current = deezerId;

    // Best-effort: el registro no debe romper la navegación, pero un fallo
    // recurrente tampoco debe desaparecer en silencio.
    apiCatalogRecordView(resourceType, deezerId, accessToken).catch((err) =>
      Sentry.captureException(err),
    );
  }, [status, accessToken, resourceType, deezerId]);
}
