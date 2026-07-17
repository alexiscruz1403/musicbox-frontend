import { getOfflineDb } from "./db";

interface ItemWithId {
  id: string;
}

// Implementa la regla del enunciado: página 1 (sin cursor) sobreescribe la
// lista cacheada; página >1 se agrega (con dedupe por id) a lo ya guardado.
export async function writeListPage<T extends ItemWithId>(
  key: string,
  items: T[],
  isFirstPage: boolean,
): Promise<void> {
  const db = await getOfflineDb();
  const existing = await db.get("paginated-lists", key);

  let merged: T[];
  if (isFirstPage || !existing) {
    merged = items;
  } else {
    const seen = new Set((existing.items as T[]).map((i) => i.id));
    merged = [...(existing.items as T[]), ...items.filter((i) => !seen.has(i.id))];
  }

  await db.put("paginated-lists", { key, items: merged, updatedAt: Date.now() });
}

export async function readListCache<T>(key: string): Promise<T[]> {
  const db = await getOfflineDb();
  const record = await db.get("paginated-lists", key);
  return (record?.items as T[] | undefined) ?? [];
}
