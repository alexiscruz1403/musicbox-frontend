"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { getInitials, timeAgo } from "@/lib/review-format";
import { useNotificationText, notificationHref } from "@/lib/notification-format";
import { apiMarkNotificationRead, apiRespondFollowRequest } from "@/lib/api";
import { tokenStore } from "@/lib/token-store";
import { cn } from "@/lib/utils";
import type { NotificationRow as NotificationRowData } from "@/types/api";

interface NotificationRowProps {
  notification: NotificationRowData;
  forceRead: boolean;
  onClose: () => void;
  // Only set for FOLLOW_REQUEST rows whose pending request could be matched
  // via GET /users/me/follow-requests (actorId === requester.id). Undefined
  // means either the type isn't FOLLOW_REQUEST or it was already resolved.
  followRequestId?: string;
}

export function NotificationRow({
  notification,
  forceRead,
  onClose,
  followRequestId,
}: NotificationRowProps) {
  const t = useTranslations("Notifications");
  const notificationText = useNotificationText(notification);
  const queryClient = useQueryClient();
  const [justRead, setJustRead] = useState(false);
  const [resolution, setResolution] = useState<"accepted" | "rejected" | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [, startRespondTransition] = useTransition();

  const unread = !notification.readAt && !justRead && !forceRead;
  const grouped = notification.actorCount != null && notification.actorCount >= 2;

  function markRead() {
    if (!unread) return;
    setJustRead(true);
    startTransition(async () => {
      const token = tokenStore.getAccessToken();
      if (!token) {
        setJustRead(false);
        return;
      }
      try {
        await apiMarkNotificationRead(token, notification.id);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        setJustRead(false);
      }
    });
  }

  function handleClick() {
    onClose();
    markRead();
  }

  function handleRespond(status: "ACCEPTED" | "REJECTED") {
    if (!followRequestId) return;
    const token = tokenStore.getAccessToken();
    if (!token) return;
    setRespondError(null);
    startRespondTransition(async () => {
      try {
        await apiRespondFollowRequest(token, followRequestId, status);
        setResolution(status === "ACCEPTED" ? "accepted" : "rejected");
        markRead();
        void queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      } catch {
        setRespondError(t("respondError"));
      }
    });
  }

  const showRequestActions =
    notification.type === "FOLLOW_REQUEST" && !!followRequestId && !resolution;

  const avatar = (
    <span className="relative shrink-0" aria-hidden>
      {notification.actor ? (
        notification.actor.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={notification.actor.avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent">
            {getInitials(notification.actor.displayName)}
          </span>
        )
      ) : (
        <span className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-mb-accent">
          <ShieldAlert className="w-4 h-4" />
        </span>
      )}
      {grouped && (
        <span className="absolute -bottom-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-mb-primary text-[10px] font-bold text-white flex items-center justify-center border-2 border-mb-card">
          +{notification.actorCount! - 1}
        </span>
      )}
    </span>
  );

  const headerLine = (
    <>
      <span className="block text-[13px] leading-relaxed text-mb-text">
        {notification.actor && (
          <>
            <span className="font-mono text-mb-accent">@{notification.actor.handle}</span>{" "}
          </>
        )}
        {notificationText}
      </span>
      <span className="block text-[11px] text-mb-dim mt-1">
        {timeAgo(notification.createdAt)}
      </span>
    </>
  );

  const rowClassName = cn(
    "flex items-start gap-3 min-h-16 px-3.5 py-3 rounded-lg transition-colors hover:bg-mb-input",
    unread ? "bg-mb-input border-l-2 border-mb-primary" : "border-l-2 border-transparent",
  );

  const unreadDot = unread && (
    <span aria-label={t("unreadLabel")} className="shrink-0 w-2 h-2 rounded-full bg-mb-primary mt-1.5" />
  );

  // A <button> can't nest inside a <Link> (invalid HTML + event bubbling
  // issues), so FOLLOW_REQUEST rows render as a two-row container: the
  // avatar + text link to the requester's profile on top, Accept/Reject
  // as siblings (not descendants) of that link underneath.
  if (notification.type === "FOLLOW_REQUEST") {
    return (
      <div className={cn(rowClassName, "flex-col items-stretch")}>
        <div className="flex items-start gap-3">
          <Link
            href={notificationHref(notification)}
            onClick={handleClick}
            className="flex items-start gap-3 min-w-0 flex-1"
          >
            {avatar}
            <span className="min-w-0 flex-1 pt-0.5">{headerLine}</span>
          </Link>
          {unreadDot}
        </div>
        <div className="pl-12">
          {showRequestActions && (
            <span className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => handleRespond("ACCEPTED")}
                className="min-h-9 px-3.5 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {t("accept")}
              </button>
              <button
                type="button"
                onClick={() => handleRespond("REJECTED")}
                className="min-h-9 px-3.5 bg-transparent border border-mb-border rounded-lg text-mb-muted font-medium text-xs hover:border-mb-dim hover:text-mb-text transition-colors cursor-pointer"
              >
                {t("reject")}
              </button>
            </span>
          )}
          {resolution && (
            <span
              className={cn(
                "block mt-2 text-xs font-medium",
                resolution === "accepted" ? "text-mb-success" : "text-mb-muted",
              )}
            >
              {resolution === "accepted" ? t("requestAccepted") : t("requestRejected")}
            </span>
          )}
          {respondError && (
            <span role="alert" className="block mt-2 text-xs text-mb-error">
              {respondError}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link href={notificationHref(notification)} onClick={handleClick} className={rowClassName}>
      {avatar}
      <span className="min-w-0 flex-1 pt-0.5">{headerLine}</span>
      {unreadDot}
    </Link>
  );
}
