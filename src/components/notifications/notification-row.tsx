"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getInitials, timeAgo } from "@/lib/review-format";
import { getNotificationText, notificationHref } from "@/lib/notification-format";
import { apiMarkNotificationRead } from "@/lib/api";
import { tokenStore } from "@/lib/token-store";
import { cn } from "@/lib/utils";
import type { NotificationRow as NotificationRowData } from "@/types/api";

interface NotificationRowProps {
  notification: NotificationRowData;
  forceRead: boolean;
  onClose: () => void;
}

export function NotificationRow({ notification, forceRead, onClose }: NotificationRowProps) {
  const queryClient = useQueryClient();
  const [justRead, setJustRead] = useState(false);
  const [, startTransition] = useTransition();

  const unread = !notification.readAt && !justRead && !forceRead;
  const grouped = notification.actorCount != null && notification.actorCount >= 2;

  function handleClick() {
    onClose();
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

  return (
    <Link
      href={notificationHref(notification)}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 min-h-16 px-3.5 py-3 rounded-lg transition-colors hover:bg-mb-input",
        unread ? "bg-mb-input border-l-2 border-mb-primary" : "border-l-2 border-transparent",
      )}
    >
      <span className="relative shrink-0" aria-hidden>
        {notification.actor.avatarUrl ? (
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
        )}
        {grouped && (
          <span className="absolute -bottom-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-mb-primary text-[10px] font-bold text-white flex items-center justify-center border-2 border-mb-card">
            +{notification.actorCount! - 1}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[13px] leading-relaxed text-mb-text">
          <span className="font-mono text-mb-accent">@{notification.actor.handle}</span>{" "}
          {getNotificationText(notification)}
        </span>
        <span className="block text-[11px] text-mb-dim mt-1">
          {timeAgo(notification.createdAt)}
        </span>
      </span>

      {unread && (
        <span
          aria-label="No leída"
          className="shrink-0 w-2 h-2 rounded-full bg-mb-primary mt-1.5"
        />
      )}
    </Link>
  );
}
