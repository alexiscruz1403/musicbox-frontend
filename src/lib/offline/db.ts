import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  RecentlyViewedDetailItem,
  MeResponse,
  NotificationPreferences,
} from "@/types/api";

const DB_NAME = "vinlyst-offline";
const DB_VERSION = 1;

export type MutationKind =
  | "CREATE_REVIEW"
  | "UPDATE_REVIEW"
  | "DELETE_REVIEW"
  | "PATCH_PROFILE"
  | "UPLOAD_AVATAR"
  | "UPLOAD_COVER"
  | "UPDATE_NOTIF_PREFS";

export interface MutationQueueItem {
  id: string;
  kind: MutationKind;
  payload: unknown;
  createdAt: number;
  retries: number;
}

export interface PaginatedListRecord {
  key: string;
  items: unknown[];
  updatedAt: number;
}

interface VinlystOfflineDB extends DBSchema {
  "recently-viewed-details": {
    key: string;
    value: RecentlyViewedDetailItem & { key: string };
  };
  "paginated-lists": {
    key: string;
    value: PaginatedListRecord;
  };
  "mutation-queue": {
    key: string;
    value: MutationQueueItem;
  };
  "profile-cache": {
    key: string;
    value: { key: string; user: MeResponse["user"] };
  };
  "notif-prefs-cache": {
    key: string;
    value: { key: string; prefs: NotificationPreferences };
  };
}

let dbPromise: Promise<IDBPDatabase<VinlystOfflineDB>> | null = null;

export function getOfflineDb(): Promise<IDBPDatabase<VinlystOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VinlystOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("recently-viewed-details")) {
          db.createObjectStore("recently-viewed-details", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("paginated-lists")) {
          db.createObjectStore("paginated-lists", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("mutation-queue")) {
          db.createObjectStore("mutation-queue", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("profile-cache")) {
          db.createObjectStore("profile-cache", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("notif-prefs-cache")) {
          db.createObjectStore("notif-prefs-cache", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export function recentlyViewedKey(resourceType: string, deezerId: string): string {
  return `${resourceType}:${deezerId}`;
}

export const PROFILE_CACHE_KEY = "me";
