import { getOfflineDb, recentlyViewedKey } from "./db";
import { apiCatalogRecentlyViewedDetails } from "@/lib/api";
import type { RecentlyViewedDetailItem } from "@/types/api";

// Se llama cada vez que hay conexión + sesión activa (ver sw-register.tsx /
// offline-mode-gate.tsx). Sobreescribe todo el store — el bundle del backend
// ya devuelve el conjunto completo y ordenado de los ≤10 recursos vigentes.
export async function refreshRecentlyViewedCache(accessToken: string): Promise<void> {
  const { data } = await apiCatalogRecentlyViewedDetails(accessToken);
  const db = await getOfflineDb();
  const tx = db.transaction("recently-viewed-details", "readwrite");
  await tx.store.clear();
  await Promise.all(
    data.map((item) =>
      tx.store.put({
        ...item,
        key: recentlyViewedKey(item.resourceType, item.deezerId),
      }),
    ),
  );
  await tx.done;
}

export async function listCachedRecentlyViewed(): Promise<RecentlyViewedDetailItem[]> {
  const db = await getOfflineDb();
  const all = await db.getAll("recently-viewed-details");
  return all.sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime(),
  );
}

export async function getCachedResourceDetail(
  resourceType: string,
  deezerId: string,
): Promise<RecentlyViewedDetailItem | undefined> {
  const db = await getOfflineDb();
  return db.get("recently-viewed-details", recentlyViewedKey(resourceType, deezerId));
}
