"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationsPanelStore } from "@/stores/notifications-panel-store";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  accessToken: string | null;
  className?: string;
}

export function NotificationBell({ accessToken, className }: NotificationBellProps) {
  const t = useTranslations("Notifications");
  const toggle = useNotificationsPanelStore((s) => s.toggle);
  const { data } = useUnreadNotifications(accessToken);
  const hasUnread = (data?.data.items.length ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("title")}
      className={cn(
        "relative inline-flex items-center justify-center text-mb-muted hover:text-mb-text hover:bg-mb-input rounded-lg transition-colors cursor-pointer",
        className,
      )}
    >
      <Bell className="w-[18px] h-[18px]" />
      {hasUnread && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mb-primary"
        />
      )}
    </button>
  );
}
