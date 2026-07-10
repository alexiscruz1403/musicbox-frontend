"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, CheckCheck } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiMarkAllNotificationsRead, apiNotifications } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/stores/notifications-panel-store";
import { useUnreadNotifications, UNREAD_PEEK_LIMIT } from "@/hooks/use-unread-notifications";
import { NotificationRow } from "./notification-row";

type NotifTab = "all" | "unread";

const TABS: { id: NotifTab; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
];

interface NotificationsPanelProps {
  accessToken: string | null;
}

export function NotificationsPanel({ accessToken }: NotificationsPanelProps) {
  const { isOpen, close } = useNotificationsPanelStore();
  const [tab, setTab] = useState<NotifTab>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadData } = useUnreadNotifications(accessToken);
  const unreadCount = unreadData?.data.items.length ?? 0;

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["notifications", "list", tab],
    queryFn: ({ pageParam }) =>
      apiNotifications(accessToken as string, {
        cursor: pageParam as string | undefined,
        unreadOnly: tab === "unread",
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: isOpen && !!accessToken,
    staleTime: 10 * 1000,
  });

  const items = (pages?.pages ?? []).flatMap((p) => p.data.items);
  const isLoading = isFetching && items.length === 0;

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || !isOpen) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

  function handleMarkAllRead() {
    if (!accessToken) return;
    setMarkingAll(true);
    startTransition(async () => {
      try {
        await apiMarkAllNotificationsRead(accessToken);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        setMarkingAll(false);
      }
    });
  }

  if (!accessToken || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="hidden md:block absolute inset-0 bg-black/50 cursor-pointer"
        onClick={close}
        aria-hidden
      />

      <section
        role="dialog"
        aria-label="Notificaciones"
        className="absolute top-0 right-0 bottom-16 md:bottom-0 w-full md:w-[420px] bg-mb-card border-l border-mb-border flex flex-col shadow-[-12px_0_48px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-mb-border">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar notificaciones"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-serif font-normal text-xl text-mb-text truncate">
              Notificaciones
            </h2>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-mb-accent text-xs font-medium hover:bg-mb-dp transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </button>
        </div>

        <div className="flex gap-1 px-3 border-b border-mb-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-11 px-3.5 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px flex items-center gap-1.5",
                tab === t.id
                  ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                  : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
              )}
            >
              {t.label}
              {t.id === "unread" && unreadCount > 0 && (
                <span className="font-mono text-[11px] text-mb-accent">
                  {unreadCount >= UNREAD_PEEK_LIMIT ? `${UNREAD_PEEK_LIMIT}+` : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-mb-input shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-mb-input" />
                    <div className="h-3 w-1/4 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-14 h-14 rounded-full bg-mb-input border border-mb-border flex items-center justify-center mb-4">
                <CheckCheck className="w-6 h-6 text-mb-success" />
              </div>
              <p className="text-[15px] text-mb-muted">
                Estás al día. Sin notificaciones nuevas.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    forceRead={markingAll}
                    onClose={close}
                  />
                ))}
              </div>
              <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-2">
                {isFetchingNextPage && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                    aria-label="Cargando más notificaciones"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
