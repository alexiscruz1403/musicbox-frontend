import { getOfflineDb, type MutationKind, type MutationQueueItem } from "./db";
import { generateIdempotencyKey } from "@/lib/api";

export const MUTATION_QUEUE_CHANGED_EVENT = "vinlyst:mutation-queue-changed";

function notifyQueueChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MUTATION_QUEUE_CHANGED_EVENT));
  }
}

// El id se genera una sola vez, al encolar — no en cada reintento — porque es
// también el Idempotency-Key que viaja al backend en cada replay (ver
// sync-manager.ts). Reintentar con el mismo id es lo que hace seguro repetir
// la request sin duplicar nada del lado del servidor.
export async function enqueueMutation(
  kind: MutationKind,
  payload: unknown,
): Promise<MutationQueueItem> {
  const db = await getOfflineDb();
  const item: MutationQueueItem = {
    id: generateIdempotencyKey(),
    kind,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };
  await db.put("mutation-queue", item);
  notifyQueueChanged();
  return item;
}

export async function listMutations(): Promise<MutationQueueItem[]> {
  const db = await getOfflineDb();
  const items = await db.getAll("mutation-queue");
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete("mutation-queue", id);
  notifyQueueChanged();
}

export async function bumpMutationRetry(id: string): Promise<void> {
  const db = await getOfflineDb();
  const item = await db.get("mutation-queue", id);
  if (!item) return;
  item.retries += 1;
  await db.put("mutation-queue", item);
}
