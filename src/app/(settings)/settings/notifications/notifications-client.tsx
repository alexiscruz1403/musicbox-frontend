"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiUpdateNotificationPrefs, generateIdempotencyKey, ApiError } from "@/lib/api";
import {
  isPushSupported,
  getCurrentPushPermission,
  requestPushPermissionAndSubscribe,
  unsubscribeFromPush,
} from "@/lib/push";
import type { NotificationPreferences } from "@/types/api";

interface NotificationsClientProps {
  initialPrefs: NotificationPreferences;
  accessToken: string;
}

interface ToggleRowProps {
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, on, disabled, onToggle }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      onClick={onToggle}
      className="flex items-center justify-between gap-4 w-full min-h-14 py-3 border-b border-mb-card last:border-b-0 text-left cursor-pointer disabled:cursor-not-allowed"
    >
      <span className="text-[15px] text-mb-text">{label}</span>
      <span
        aria-hidden
        className={cn(
          "shrink-0 w-11 h-6.5 rounded-full relative transition-colors",
          on ? "bg-mb-primary" : "bg-mb-border",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] w-5 h-5 rounded-full bg-mb-text transition-all",
            on ? "left-[21px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

export default function NotificationsClient({
  initialPrefs,
  accessToken,
}: NotificationsClientProps) {
  const t = useTranslations("Settings.Notifications");
  const tCommon = useTranslations("Common");
  // The backend returns exactly one of these two fields, never both — which
  // one depends on the account's current isPrivate setting.
  const isPrivateAccount = initialPrefs.followRequestsEnabled !== undefined;

  const [master, setMaster] = useState(true);
  const [likes, setLikes] = useState(initialPrefs.likesEnabled);
  const [dislikes, setDislikes] = useState(initialPrefs.dislikesEnabled);
  const [comments, setComments] = useState(initialPrefs.commentsEnabled);
  const [followToggle, setFollowToggle] = useState(
    isPrivateAccount
      ? (initialPrefs.followRequestsEnabled ?? true)
      : (initialPrefs.followsEnabled ?? true),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushPending, startPushTransition] = useTransition();

  useEffect(() => {
    if (!isPushSupported()) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => {});
  }, []);

  function togglePush() {
    setPushError(null);
    startPushTransition(async () => {
      try {
        if (pushEnabled) {
          await unsubscribeFromPush(accessToken);
          setPushEnabled(false);
        } else {
          const granted = await requestPushPermissionAndSubscribe(accessToken);
          if (!granted) {
            setPushError(t("pushPermissionDenied"));
            return;
          }
          setPushEnabled(true);
        }
      } catch {
        setPushError(t("pushUpdateError"));
      }
    });
  }

  function toggle(setter: (fn: (v: boolean) => boolean) => void) {
    if (!master) return;
    setter((v) => !v);
    setSavedOk(false);
  }

  function handleSave() {
    setSaveError(null);
    setSavedOk(false);
    startTransition(async () => {
      try {
        const followField = isPrivateAccount ? "followRequestsEnabled" : "followsEnabled";
        await apiUpdateNotificationPrefs(
          accessToken,
          master
            ? {
                likesEnabled: likes,
                dislikesEnabled: dislikes,
                commentsEnabled: comments,
                [followField]: followToggle,
              }
            : {
                likesEnabled: false,
                dislikesEnabled: false,
                commentsEnabled: false,
                [followField]: false,
              },
          generateIdempotencyKey(),
        );
        setSavedOk(true);
      } catch (err) {
        const apiErr = err as ApiError;
        setSaveError(apiErr.message || t("saveError"));
      }
    });
  }

  const rows: { key: string; label: string; on: boolean; onToggle: () => void }[] = [
    { key: "likes", label: t("likesLabel"), on: likes, onToggle: () => toggle(setLikes) },
    {
      key: "dislikes",
      label: t("dislikesLabel"),
      on: dislikes,
      onToggle: () => toggle(setDislikes),
    },
    {
      key: "comments",
      label: t("commentsLabel"),
      on: comments,
      onToggle: () => toggle(setComments),
    },
    {
      key: "follow",
      label: isPrivateAccount ? t("followRequestsLabel") : t("newFollowersLabel"),
      on: followToggle,
      onToggle: () => toggle(setFollowToggle),
    },
  ];

  return (
    <div className="min-h-screen bg-mb-bg pb-28 md:pb-16">
      <header className="md:hidden sticky top-0 z-10 bg-mb-bg/80 backdrop-blur border-b border-mb-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="text-mb-muted hover:text-mb-text transition-colors cursor-pointer"
          aria-label={tCommon("back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-mb-text">{t("title")}</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 md:py-14">
        <div className="hidden md:block mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors mb-6 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")}
          </button>
          <h1 className="font-serif text-3xl text-mb-text mb-1.5">{t("title")}</h1>
          <p className="text-sm text-mb-muted mb-8">{t("subtitle")}</p>
        </div>

        {saveError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {saveError}
          </div>
        )}
        {savedOk && (
          <div
            role="status"
            className="mb-6 bg-mb-success/10 border border-mb-success rounded-lg px-4 py-3 text-mb-success text-sm"
          >
            {t("preferencesSaved")}
          </div>
        )}

        {/* Master switch */}
        <button
          type="button"
          role="switch"
          aria-checked={master}
          onClick={() => {
            setMaster((v) => !v);
            setSavedOk(false);
          }}
          className={cn(
            "flex items-center justify-between gap-4 w-full min-h-16 px-4.5 py-4 bg-mb-card border rounded-xl text-left transition-colors cursor-pointer",
            master ? "border-mb-ddp" : "border-mb-border",
          )}
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-mb-text">
              {t("receiveNotifications")}
            </span>
            <span className="block text-[13px] text-mb-muted mt-0.5">
              {master
                ? t("receivingOn")
                : t("receivingOff")}
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "shrink-0 w-[52px] h-[30px] rounded-full relative transition-colors",
              master ? "bg-mb-primary" : "bg-mb-border",
            )}
          >
            <span
              className={cn(
                "absolute top-[3px] w-6 h-6 rounded-full bg-mb-text transition-all",
                master ? "left-[25px]" : "left-[3px]",
              )}
            />
          </span>
        </button>

        <div className="h-px w-full bg-mb-border my-7" />

        {/* Individual toggles */}
        <div
          className={cn(
            "flex flex-col transition-opacity",
            master ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none",
          )}
        >
          {rows.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              on={row.on && master}
              disabled={!master}
              onToggle={row.onToggle}
            />
          ))}
        </div>

        {isPushSupported() && getCurrentPushPermission() !== "denied" && (
          <>
            <div className="h-px w-full bg-mb-border my-7" />
            <div>
              <h2 className="text-sm font-semibold text-mb-text mb-1">
                {t("pushTitle")}
              </h2>
              <p className="text-[13px] text-mb-muted mb-3">
                {t("pushDescription")}
              </p>
              {pushError && (
                <p role="alert" className="text-xs text-mb-error mb-2">
                  {pushError}
                </p>
              )}
              <ToggleRow
                label={t("enablePushBrowser")}
                on={pushEnabled}
                disabled={pushPending}
                onToggle={togglePush}
              />
            </div>
          </>
        )}

        {/* Save (desktop inline) */}
        <div className="hidden md:block mt-9">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="min-h-12 px-6.5 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-[15px] transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? tCommon("saving") : t("savePreferences")}
          </button>
        </div>
      </div>

      {/* Save (mobile sticky) */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-20 bg-mb-bg border-t border-mb-border px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full min-h-12 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-[15px] transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? tCommon("saving") : t("savePreferences")}
        </button>
      </div>
    </div>
  );
}
