"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFollow, apiUnfollow, apiGetFollowers, apiGetFollowing } from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";
import { FollowButton } from "@/components/feed/follow-button";
import type { FollowStatus } from "@/lib/follow-status";
import type { FollowListItem } from "@/types/api";

interface FollowListDrawerProps {
  open: boolean;
  kind: "followers" | "following";
  handle: string;
  currentUserHandle?: string;
  accessToken?: string;
  onClose: () => void;
}

function dedupeByUserId(items: FollowListItem[]): FollowListItem[] {
  const seen = new Set<string>();
  const result: FollowListItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function FollowListDrawer({
  open,
  kind,
  handle,
  currentUserHandle,
  accessToken,
  onClose,
}: FollowListDrawerProps) {
  const router = useRouter();
  const t = useTranslations("PublicProfile.followList");
  const tCommon = useTranslations("Common");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, FollowStatus>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["follow-list", kind, handle],
    queryFn: ({ pageParam }) =>
      kind === "followers"
        ? apiGetFollowers(handle, pageParam as string | undefined, 20, accessToken)
        : apiGetFollowing(handle, pageParam as string | undefined, 20, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: open,
    staleTime: 30 * 1000,
  });

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: open,
  });

  const people = dedupeByUserId((data?.pages ?? []).flatMap((p) => p.data.items));
  const isLoading = isFetching && people.length === 0;

  function getStatus(item: FollowListItem): FollowStatus {
    return statusOverrides[item.id] ?? (item.isFollowing ? "following" : "not_following");
  }

  function handleToggleFollow(item: FollowListItem) {
    if (!accessToken) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/u/${handle}`)}`);
      return;
    }
    const current = getStatus(item);

    if (current === "following" || current === "pending") {
      setStatusOverrides((prev) => ({ ...prev, [item.id]: "not_following" }));
      startTransition(async () => {
        try {
          await apiUnfollow(item.handle, accessToken);
        } catch {
          setStatusOverrides((prev) => ({ ...prev, [item.id]: current }));
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await apiFollow(item.handle, accessToken);
        setStatusOverrides((prev) => ({
          ...prev,
          [item.id]: result?.data.status === "PENDING" ? "pending" : "following",
        }));
      } catch {
        // No optimistic state was set yet — nothing to revert.
      }
    });
  }

  if (!open) return null;

  const title = kind === "followers" ? t("followersTitle") : tCommon("following");
  const emptyText =
    kind === "followers" ? t("noFollowers") : t("noFollowing");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/60 flex justify-center items-end sm:items-stretch sm:justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:w-full sm:max-w-[420px] max-h-[85vh] sm:max-h-none sm:h-full mt-auto sm:mt-0 bg-mb-card sm:bg-mb-bg border-t sm:border-t-0 sm:border-l border-mb-border rounded-t-2xl sm:rounded-none flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-mb-border shrink-0">
          <h2 className="font-serif text-xl text-mb-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAriaLabel")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex flex-col gap-3.5 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-mb-input shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 rounded bg-mb-input" />
                    <div className="h-3 w-1/3 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : people.length === 0 ? (
            <p className="text-center text-sm text-mb-dim py-12 px-5">{emptyText}</p>
          ) : (
            <>
              {people.map((item) => {
                const status = getStatus(item);
                const isSelf = !!currentUserHandle && item.handle === currentUserHandle;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-mb-input"
                  >
                    <Link href={`/u/${item.handle}`} onClick={onClose} className="contents">
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.avatarUrl}
                          alt=""
                          aria-hidden
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="w-11 h-11 rounded-full bg-mb-dp flex items-center justify-center text-sm font-semibold text-mb-accent shrink-0"
                        >
                          {getInitials(item.displayName)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-mb-text truncate">
                            {item.displayName}
                          </span>
                          {item.isPrivate && (
                            <Lock
                              className="w-3 h-3 text-mb-dim shrink-0"
                              aria-label={t("privateAccountAriaLabel")}
                            />
                          )}
                        </span>
                        <span className="block font-mono text-xs text-mb-muted truncate">
                          @{item.handle}
                        </span>
                      </span>
                    </Link>
                    {!isSelf && (
                      <FollowButton
                        status={status}
                        isPrivate={item.isPrivate}
                        displayName={item.displayName}
                        disabled={isPending}
                        onClick={() => handleToggleFollow(item)}
                      />
                    )}
                  </div>
                );
              })}
              <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-2">
                {isFetchingNextPage && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                    aria-label={t("loadingMoreAriaLabel")}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
