"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  apiFollow,
  apiUnfollow,
  apiSearchUsers,
  apiUserSearchHistory,
} from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOutsideClose } from "@/hooks/use-outside-close";
import { UserSearchDropdown } from "./user-search-dropdown";
import { FollowButton } from "./follow-button";
import type { FollowStatus } from "@/lib/follow-status";
import type { UserSearchResult, UserQuickSearchItem } from "@/types/api";

interface UserSearchWidgetProps {
  accessToken: string;
}

export function UserSearchWidget({ accessToken }: UserSearchWidgetProps) {
  const t = useTranslations("Feed.userSearch");
  const tCommon = useTranslations("Common");
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, FollowStatus>>({});
  const [quickStatusOverrides, setQuickStatusOverrides] = useState<Record<string, FollowStatus>>({});
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  useOutsideClose(containerRef, dropdownOpen, () => setDropdownOpen(false));

  const searchEnabled = committedQuery.length >= 2;

  // Committing a search (Enter, or picking a recent-search chip) is what
  // records server-side history via /users/search — refresh the dropdown's
  // cache so the recent-searches panel reflects it next time it opens.
  useEffect(() => {
    if (!committedQuery) return;
    queryClient.invalidateQueries({ queryKey: ["user-search-history"] });
  }, [committedQuery, queryClient]);

  // User search history — fetched as soon as the page mounts (not gated on
  // dropdown focus) so it's instantly ready the first time the dropdown
  // opens; staleTime 0 + refetchOnMount "always" so every entry/redirect
  // into /feed fetches fresh data instead of a cached list.
  const { data: searchHistoryData, isLoading: searchHistoryLoading } = useQuery({
    queryKey: ["user-search-history"],
    queryFn: () => apiUserSearchHistory(accessToken),
    enabled: !!accessToken,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const searchHistory = searchHistoryData?.data ?? [];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["user-search", committedQuery],
    queryFn: ({ pageParam }) =>
      apiSearchUsers(committedQuery, pageParam as string | undefined, 10, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: searchEnabled,
    staleTime: 30 * 1000,
  });

  const results = (data?.pages ?? []).flatMap((p) => p.data.items);
  const isLoading = isFetching && results.length === 0;

  function getStatus(item: UserSearchResult): FollowStatus {
    return statusOverrides[item.id] ?? (item.isFollowing ? "following" : "not_following");
  }

  function handleToggleFollow(item: UserSearchResult) {
    const current = getStatus(item);

    // Already following, or a request is already pending — either way the
    // click cancels (DELETE handles both cases).
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

  function getQuickStatus(item: UserQuickSearchItem): FollowStatus {
    return quickStatusOverrides[item.handle] ?? (item.isFollowing ? "following" : "not_following");
  }

  function handleToggleQuickFollow(item: UserQuickSearchItem) {
    const current = getQuickStatus(item);

    if (current === "following" || current === "pending") {
      setQuickStatusOverrides((prev) => ({ ...prev, [item.handle]: "not_following" }));
      startTransition(async () => {
        try {
          await apiUnfollow(item.handle, accessToken);
        } catch {
          setQuickStatusOverrides((prev) => ({ ...prev, [item.handle]: current }));
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await apiFollow(item.handle, accessToken);
        setQuickStatusOverrides((prev) => ({
          ...prev,
          [item.handle]: result?.data.status === "PENDING" ? "pending" : "following",
        }));
      } catch {
        // No optimistic state was set yet — nothing to revert.
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        setCommittedQuery(trimmed);
        setDropdownOpen(false);
      }
    }
  }

  function handleSelectRecent(recentQuery: string) {
    setQuery(recentQuery);
    setCommittedQuery(recentQuery);
    setDropdownOpen(false);
  }

  return (
    <section className="mb-7">
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex items-center gap-3 bg-mb-input border border-mb-border rounded-lg px-4 transition-all",
            "focus-within:border-mb-primary focus-within:shadow-[0_0_0_1px_var(--color-mb-primary)]",
          )}
        >
          <Search className="w-5 h-5 text-mb-muted shrink-0" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            aria-label={t("ariaLabel")}
            placeholder={t("placeholder")}
            className="flex-1 min-w-0 h-12 bg-transparent border-none outline-none text-mb-text text-[15px] placeholder:text-mb-dim"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCommittedQuery("");
                setDropdownOpen(true);
              }}
              aria-label={tCommon("clearSearch")}
              className="w-7 h-7 flex items-center justify-center bg-mb-border rounded-full text-mb-muted hover:bg-mb-ddp hover:text-mb-text transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {dropdownOpen && (
          <UserSearchDropdown
            query={query}
            debouncedQuery={debouncedQuery}
            accessToken={accessToken}
            history={searchHistory}
            isHistoryLoading={searchHistoryLoading}
            getQuickStatus={getQuickStatus}
            isFollowActionPending={isPending}
            onToggleQuickFollow={handleToggleQuickFollow}
            onSelectRecent={handleSelectRecent}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {searchEnabled && (
        <div className="mt-3 bg-mb-card border border-mb-border rounded-xl p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-mb-input shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 rounded bg-mb-input" />
                    <div className="h-3 w-1/3 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-mb-muted text-sm text-center py-2">
              {t("noResults", { query: committedQuery })}
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {results.map((u) => {
                const status = getStatus(u);
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <Link href={`/u/${u.handle}`} className="contents">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt=""
                          aria-hidden
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
                        >
                          {getInitials(u.displayName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-mb-text truncate hover:text-mb-accent">
                          {u.displayName}
                        </div>
                        <div className="font-mono text-xs text-mb-muted truncate">@{u.handle}</div>
                      </div>
                    </Link>
                    <FollowButton
                      status={status}
                      displayName={u.displayName}
                      disabled={isPending}
                      onClick={() => handleToggleFollow(u)}
                    />
                  </div>
                );
              })}

              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mt-1 h-9 text-sm font-medium text-mb-accent hover:underline disabled:opacity-60 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage ? t("loadingMore") : t("loadMore")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
