"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { writeListPage, readListCache } from "@/lib/offline/list-cache";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface PagedResult<T> {
  items: T[];
  nextCursor: string | null;
}

interface UseOfflineListQueryOptions<T> {
  // Misma queryKey que ya usaba el useInfiniteQuery original en cada client
  // component (feed/album/track/perfil) — no cambia el cacheo en memoria de
  // TanStack Query, solo agrega un write-through/read-through a IndexedDB.
  queryKey: unknown[];
  // Clave estable para el store de IndexedDB (paginated-lists), independiente
  // de la queryKey de TanStack Query — ver src/lib/offline/list-cache.ts.
  cacheKey: string;
  fetchPage: (cursor?: string) => Promise<PagedResult<T>>;
  enabled?: boolean;
}

// Wrapper delgado sobre useInfiniteQuery reutilizado por feed-client.tsx,
// album-client.tsx, track-client.tsx y profile-client.tsx (tab de reseñas
// propias): además de paginar como siempre, escribe cada página exitosa a
// IndexedDB (página 1 = overwrite, página >1 = append) y, si el navegador
// está offline, sirve directamente lo cacheado en vez de intentar la red.
export function useOfflineListQuery<T extends { id: string }>({
  queryKey,
  cacheKey,
  fetchPage,
  enabled = true,
}: UseOfflineListQueryOptions<T>) {
  const isOnline = useOnlineStatus();
  const [offlineItems, setOfflineItems] = useState<T[]>([]);
  const [offlineLoaded, setOfflineLoaded] = useState(false);

  useEffect(() => {
    if (isOnline) return;
    let cancelled = false;
    readListCache<T>(cacheKey).then((items) => {
      if (!cancelled) {
        setOfflineItems(items);
        setOfflineLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, cacheKey]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const page = await fetchPage(cursor);
      void writeListPage(cacheKey, page.items, !cursor);
      return page;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && isOnline,
  });

  const onlineItems = (query.data?.pages ?? []).flatMap((p) => p.items);

  return {
    items: isOnline ? onlineItems : offlineItems,
    isOffline: !isOnline,
    isLoading: isOnline ? query.isLoading : !offlineLoaded,
    hasNextPage: isOnline && !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
