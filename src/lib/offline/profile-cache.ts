import { getOfflineDb, PROFILE_CACHE_KEY } from "./db";
import { apiGetMe, apiGetNotificationPrefs } from "@/lib/api";
import type { MeResponse, NotificationPreferences } from "@/types/api";

export async function refreshProfileCache(accessToken: string): Promise<void> {
  const [{ data: me }, { data: prefs }] = await Promise.all([
    apiGetMe(accessToken),
    apiGetNotificationPrefs(accessToken),
  ]);
  const db = await getOfflineDb();
  await Promise.all([
    db.put("profile-cache", { key: PROFILE_CACHE_KEY, user: me.user }),
    db.put("notif-prefs-cache", { key: PROFILE_CACHE_KEY, prefs }),
  ]);
}

export async function getCachedProfile(): Promise<MeResponse["user"] | undefined> {
  const db = await getOfflineDb();
  const record = await db.get("profile-cache", PROFILE_CACHE_KEY);
  return record?.user;
}

export async function getCachedNotificationPrefs(): Promise<
  NotificationPreferences | undefined
> {
  const db = await getOfflineDb();
  const record = await db.get("notif-prefs-cache", PROFILE_CACHE_KEY);
  return record?.prefs;
}
