"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  apiUserQuickSearch,
  apiDeleteUserSearchHistoryItem,
  apiDeleteUserSearchHistory,
} from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import { RecentSearchPanel } from "@/components/shared/recent-search-panel";
import { FollowButton } from "./follow-button";
import type { ApiSuccessResponse, UserSearchHistoryItem, UserQuickSearchItem } from "@/types/api";
import type { FollowStatus } from "@/lib/follow-status";

interface UserSearchDropdownProps {
  query: string;
  debouncedQuery: string;
  accessToken: string;
  history: UserSearchHistoryItem[];
  isHistoryLoading: boolean;
  getQuickStatus: (item: UserQuickSearchItem) => FollowStatus;
  isFollowActionPending: boolean;
  onToggleQuickFollow: (item: UserQuickSearchItem) => void;
  onSelectRecent: (query: string) => void;
  onClose: () => void;
}

export function UserSearchDropdown({
  query,
  debouncedQuery,
  accessToken,
  history,
  isHistoryLoading,
  getQuickStatus,
  isFollowActionPending,
  onToggleQuickFollow,
  onSelectRecent,
  onClose,
}: UserSearchDropdownProps) {
  const t = useTranslations("Feed.userSearch");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const showRecent = query.trim().length === 0;

  const predictiveQuery = useQuery({
    queryKey: ["user-quick-search", debouncedQuery],
    queryFn: () => apiUserQuickSearch(debouncedQuery),
    enabled: !showRecent && debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => apiDeleteUserSearchHistoryItem(accessToken, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["user-search-history"] });
      const previous = queryClient.getQueryData<
        ApiSuccessResponse<UserSearchHistoryItem[]>
      >(["user-search-history"]);
      if (previous) {
        queryClient.setQueryData(["user-search-history"], {
          data: previous.data.filter((h) => h.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["user-search-history"], ctx.previous);
      }
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => apiDeleteUserSearchHistory(accessToken),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user-search-history"] });
      const previous = queryClient.getQueryData<
        ApiSuccessResponse<UserSearchHistoryItem[]>
      >(["user-search-history"]);
      queryClient.setQueryData(["user-search-history"], { data: [] });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["user-search-history"], ctx.previous);
      }
    },
  });

  const predictive = predictiveQuery.data?.data ?? [];

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-mb-card border border-mb-border rounded-xl shadow-lg p-2 max-h-[320px] overflow-y-auto overflow-x-hidden">
      {showRecent ? (
        <RecentSearchPanel
          title={t("recentTitle")}
          items={history.map((h) => ({
            id: h.id,
            label: h.query,
            searchedAt: h.searchedAt,
          }))}
          isLoading={isHistoryLoading}
          emptyLabel={tCommon("noRecentSearches")}
          onSelect={(row) => onSelectRecent(row.label)}
          onDeleteOne={(id) => deleteOneMutation.mutate(id)}
          onDeleteAll={() => deleteAllMutation.mutate()}
        />
      ) : predictiveQuery.isLoading ? (
        <div className="flex flex-col gap-2.5 px-1 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-mb-input shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/2 rounded bg-mb-input" />
                <div className="h-2.5 w-1/3 rounded bg-mb-input" />
              </div>
            </div>
          ))}
        </div>
      ) : predictive.length === 0 ? (
        <p className="px-2 py-2 text-xs text-mb-dim">{t("noMatches")}</p>
      ) : (
        predictive.map((item) => {
          const status = getQuickStatus(item);
          return (
            <div
              key={item.handle}
              className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-mb-input"
            >
              <Link
                href={`/u/${item.handle}`}
                onClick={onClose}
                className="contents"
              >
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatarUrl}
                    alt=""
                    aria-hidden
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="w-8 h-8 rounded-full bg-mb-dp flex items-center justify-center text-[11px] font-semibold text-mb-accent shrink-0"
                  >
                    {getInitials(item.displayName)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-mb-text truncate">
                    {item.displayName}
                  </span>
                  <span className="block font-mono text-xs text-mb-muted truncate">
                    @{item.handle}
                  </span>
                </span>
                {item.isPrivate && (
                  <Lock className="w-3.5 h-3.5 text-mb-dim shrink-0" aria-hidden />
                )}
              </Link>
              <FollowButton
                status={status}
                isPrivate={item.isPrivate}
                displayName={item.displayName}
                disabled={isFollowActionPending}
                onClick={() => onToggleQuickFollow(item)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
