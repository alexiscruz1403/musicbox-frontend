"use client";

import { useEffect, useState, useTransition } from "react";
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { listCachedRecentlyViewed } from "@/lib/offline/recently-viewed-cache";
import { readListCache } from "@/lib/offline/list-cache";
import { getCachedProfile, getCachedNotificationPrefs } from "@/lib/offline/profile-cache";
import { enqueueMutation } from "@/lib/offline/mutation-queue";
import { OfflineResourceDetail } from "./offline-resource-detail";
import type {
  RecentlyViewedDetailItem,
  UserReviewHistoryItem,
  CatalogReview,
  MeResponse,
  NotificationPreferences,
  CatalogAlbum,
  CatalogTrack,
  ArtistDetail,
} from "@/types/api";

type Tab = "recent" | "my-reviews" | "feed" | "profile" | "notifications";

const TAB_IDS: Tab[] = ["recent", "my-reviews", "feed", "profile", "notifications"];

const TAB_LABEL_KEYS: Record<Tab, string> = {
  recent: "tabRecent",
  "my-reviews": "tabMyReviews",
  feed: "tabFeed",
  profile: "tabProfile",
  notifications: "tabNotifications",
};

function resourceDisplay(
  item: RecentlyViewedDetailItem,
  artistLabel: string,
): { title: string; subtitle: string; coverUrl: string | null } | null {
  if (!item.detail) return null;
  if (item.resourceType === "ARTIST") {
    const d = item.detail as ArtistDetail;
    return { title: d.artist.name, subtitle: artistLabel, coverUrl: d.artist.imageUrl };
  }
  if (item.resourceType === "ALBUM") {
    const d = item.detail as CatalogAlbum;
    return { title: d.title, subtitle: d.artist.name, coverUrl: d.coverUrl };
  }
  const d = item.detail as CatalogTrack;
  return { title: d.title, subtitle: d.artist.name, coverUrl: d.coverUrl };
}

interface OfflineHomeProps {
  accessToken: string;
}

// Vista offline dedicada, 100% client-side, leída de IndexedDB. Reemplaza el
// contenido normal de (main) cuando navigator.onLine === false — ver
// offline-mode-gate.tsx. No hace ninguna llamada de red.
export function OfflineHome({ accessToken }: OfflineHomeProps) {
  void accessToken; // reservado para acciones futuras que lo necesiten directamente
  const t = useTranslations("Offline.home");
  const TABS = TAB_IDS.map((id) => ({ id, label: t(TAB_LABEL_KEYS[id]) }));
  const [tab, setTab] = useState<Tab>("recent");
  const [recent, setRecent] = useState<RecentlyViewedDetailItem[]>([]);
  const [selected, setSelected] = useState<RecentlyViewedDetailItem | null>(null);
  const [myReviews, setMyReviews] = useState<UserReviewHistoryItem[]>([]);
  const [feed, setFeed] = useState<CatalogReview[]>([]);
  const [profile, setProfile] = useState<MeResponse["user"] | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    void listCachedRecentlyViewed().then(setRecent);
    void getCachedProfile().then(async (user) => {
      setProfile(user ?? null);
      if (user) {
        const items = await readListCache<UserReviewHistoryItem>(`user-reviews:${user.handle}`);
        setMyReviews(items);
      }
    });
    void readListCache<CatalogReview>("feed:FOLLOWED").then(setFeed);
    void getCachedNotificationPrefs().then((p) => setPrefs(p ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-mb-border bg-mb-card">
        <WifiOff className="w-4 h-4 text-mb-muted shrink-0" />
        <p className="text-sm text-mb-muted">
          {t("offlineBanner")}
        </p>
      </div>

      <div className="flex gap-1 border-b border-mb-border px-4 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setSelected(null);
            }}
            className={`shrink-0 h-11 px-3.5 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px ${
              tab === t.id
                ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recent" &&
        (selected ? (
          <OfflineResourceDetail item={selected} onBack={() => setSelected(null)} />
        ) : (
          <RecentList items={recent} onSelect={setSelected} />
        ))}

      {tab === "my-reviews" && <MyReviewsList items={myReviews} />}

      {tab === "feed" && <FeedList items={feed} />}

      {tab === "profile" && profile && <ProfileTab user={profile} />}

      {tab === "notifications" && prefs && <NotificationsTab prefs={prefs} />}
    </div>
  );
}

function RecentList({
  items,
  onSelect,
}: {
  items: RecentlyViewedDetailItem[];
  onSelect: (item: RecentlyViewedDetailItem) => void;
}) {
  const t = useTranslations("Offline.home");
  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-mb-muted text-center">
        {t("noSavedResources")}
      </p>
    );
  }
  return (
    <ul className="p-2">
      {items.map((item) => {
        const display = resourceDisplay(item, t("artistLabel"));
        return (
          <li key={`${item.resourceType}:${item.deezerId}`}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-mb-input transition-colors text-left cursor-pointer"
            >
              <div
                className="w-11 h-11 rounded-lg bg-mb-dp shrink-0 bg-cover bg-center"
                style={display?.coverUrl ? { backgroundImage: `url(${display.coverUrl})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-mb-text truncate">
                  {display?.title ?? t("notAvailableOffline")}
                </p>
                <p className="text-xs text-mb-muted truncate">{display?.subtitle}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MyReviewsList({ items }: { items: UserReviewHistoryItem[] }) {
  const t = useTranslations("Offline.home");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(8);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function startEdit(item: UserReviewHistoryItem) {
    setEditingId(item.id);
    setDescription(item.description);
    setRating(Number(item.rating));
  }

  function saveEdit(item: UserReviewHistoryItem) {
    startTransition(async () => {
      await enqueueMutation("UPDATE_REVIEW", {
        reviewId: item.id,
        review:
          item.type === "TRACK"
            ? { description, rating }
            : { description },
      });
      setPendingIds((s) => new Set(s).add(item.id));
      setEditingId(null);
    });
  }

  function remove(item: UserReviewHistoryItem) {
    startTransition(async () => {
      await enqueueMutation("DELETE_REVIEW", { reviewId: item.id });
      setPendingIds((s) => new Set(s).add(item.id));
    });
  }

  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-mb-muted text-center">
        {t("noOwnReviews")}
      </p>
    );
  }

  return (
    <ul className="p-3 space-y-3">
      {items.map((item) => (
        <li key={item.id} className="bg-mb-card border border-mb-border rounded-xl p-3.5">
          <p className="text-sm font-medium text-mb-text">{item.externalTitle}</p>
          <p className="text-xs text-mb-muted mb-2">{item.externalArtistName}</p>

          {pendingIds.has(item.id) ? (
            <p className="text-xs text-mb-accent">{t("pendingSync")}</p>
          ) : editingId === item.id ? (
            <div className="space-y-2">
              {item.type === "TRACK" && (
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-20 h-9 bg-mb-input border border-mb-border rounded-lg px-2 text-mb-text text-sm"
                />
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-mb-input border border-mb-border rounded-lg px-3 py-2 text-mb-text text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit(item)}
                  className="h-9 px-3 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white text-xs font-semibold cursor-pointer"
                >
                  {t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="h-9 px-3 border border-mb-border rounded-lg text-mb-muted text-xs cursor-pointer"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-mb-text line-clamp-2 flex-1">{item.description}</p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs text-mb-accent cursor-pointer"
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="text-xs text-mb-error cursor-pointer"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function FeedList({ items }: { items: CatalogReview[] }) {
  const t = useTranslations("Offline.home");
  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-mb-muted text-center">
        {t("noFeedReviews")}
      </p>
    );
  }
  return (
    <ul className="p-3 space-y-3">
      {items.map((item) => (
        <li key={item.id} className="bg-mb-card border border-mb-border rounded-xl p-3.5">
          <p className="text-xs text-mb-muted mb-1">@{item.user.handle}</p>
          {item.externalTitle && (
            <p className="text-sm font-medium text-mb-text">
              {item.externalTitle} · {item.externalArtistName}
            </p>
          )}
          <p className="text-sm text-mb-text mt-1 line-clamp-3">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

function ProfileTab({ user }: { user: MeResponse["user"] }) {
  const t = useTranslations("Offline.home");
  const [displayName, setDisplayName] = useState(user.displayName);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await enqueueMutation("PATCH_PROFILE", { updates: { displayName } });
      setSaved(true);
    });
  }

  return (
    <div className="p-4 space-y-4 max-w-sm">
      <div>
        <label className="block text-sm text-mb-muted mb-1">{t("displayNameLabel")}</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setSaved(false);
          }}
          className="w-full h-11 bg-mb-input border border-mb-border rounded-lg px-3 text-mb-text"
        />
      </div>
      <p className="text-xs text-mb-dim">
        {t("avatarCoverOfflineNote")}
      </p>
      {saved ? (
        <p className="text-xs text-mb-accent">{t("pendingSync")}</p>
      ) : (
        <button
          type="button"
          onClick={save}
          className="h-10 px-4 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white text-sm font-semibold cursor-pointer"
        >
          {t("save")}
        </button>
      )}
    </div>
  );
}

function NotificationsTab({ prefs }: { prefs: NotificationPreferences }) {
  const t = useTranslations("Offline.home");
  const [likes, setLikes] = useState(prefs.likesEnabled);
  const [dislikes, setDislikes] = useState(prefs.dislikesEnabled);
  const [comments, setComments] = useState(prefs.commentsEnabled);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const isPrivateAccount = prefs.followRequestsEnabled !== undefined;
  const [followToggle, setFollowToggle] = useState(
    isPrivateAccount ? (prefs.followRequestsEnabled ?? true) : (prefs.followsEnabled ?? true),
  );

  function save() {
    startTransition(async () => {
      const followField = isPrivateAccount ? "followRequestsEnabled" : "followsEnabled";
      await enqueueMutation("UPDATE_NOTIF_PREFS", {
        updates: {
          likesEnabled: likes,
          dislikesEnabled: dislikes,
          commentsEnabled: comments,
          [followField]: followToggle,
        },
      });
      setSaved(true);
    });
  }

  const rows: { label: string; on: boolean; onToggle: () => void }[] = [
    { label: t("likesLabel"), on: likes, onToggle: () => setLikes((v) => !v) },
    { label: t("dislikesLabel"), on: dislikes, onToggle: () => setDislikes((v) => !v) },
    { label: t("commentsLabel"), on: comments, onToggle: () => setComments((v) => !v) },
    {
      label: isPrivateAccount ? t("followRequestsLabel") : t("newFollowersLabel"),
      on: followToggle,
      onToggle: () => setFollowToggle((v) => !v),
    },
  ];

  return (
    <div className="p-4 max-w-sm">
      <div className="flex flex-col divide-y divide-mb-border">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            role="switch"
            aria-checked={row.on}
            onClick={() => {
              row.onToggle();
              setSaved(false);
            }}
            className="flex items-center justify-between gap-4 py-3 text-left cursor-pointer"
          >
            <span className="text-sm text-mb-text">{row.label}</span>
            <span
              aria-hidden
              className={`w-11 h-6.5 rounded-full relative transition-colors ${
                row.on ? "bg-mb-primary" : "bg-mb-border"
              }`}
            >
              <span
                className={`absolute top-[3px] w-5 h-5 rounded-full bg-mb-text transition-all ${
                  row.on ? "left-[21px]" : "left-[3px]"
                }`}
              />
            </span>
          </button>
        ))}
      </div>
      {saved ? (
        <p className="text-xs text-mb-accent mt-4">{t("pendingSync")}</p>
      ) : (
        <button
          type="button"
          onClick={save}
          className="mt-4 h-10 px-4 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white text-sm font-semibold cursor-pointer"
        >
          {t("save")}
        </button>
      )}
    </div>
  );
}
