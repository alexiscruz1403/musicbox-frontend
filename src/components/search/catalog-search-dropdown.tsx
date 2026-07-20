"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  apiCatalogQuickSearch,
  apiDeleteCatalogSearchHistoryItem,
  apiDeleteCatalogSearchHistory,
} from "@/lib/api";
import { coverGradient } from "@/lib/review-format";
import { RecentSearchPanel } from "@/components/shared/recent-search-panel";
import type {
  ApiSuccessResponse,
  CatalogSearchHistoryItem,
  CatalogQuickSearchItem,
} from "@/types/api";

function hrefFor(item: CatalogQuickSearchItem): string {
  if (item.type === "album") return `/album/${item.deezerId}`;
  if (item.type === "track") return `/track/${item.deezerId}`;
  return `/artist/${item.deezerId}`;
}

interface CatalogSearchDropdownProps {
  query: string;
  debouncedQuery: string;
  accessToken?: string;
  history: CatalogSearchHistoryItem[];
  isHistoryLoading: boolean;
  onSelectRecent: (item: CatalogSearchHistoryItem) => void;
  onClose: () => void;
}

export function CatalogSearchDropdown({
  query,
  debouncedQuery,
  accessToken,
  history,
  isHistoryLoading,
  onSelectRecent,
  onClose,
}: CatalogSearchDropdownProps) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const showRecent = query.trim().length === 0;

  const predictiveQuery = useQuery({
    queryKey: ["catalog-quick-search", debouncedQuery],
    queryFn: () => apiCatalogQuickSearch(debouncedQuery),
    enabled: !showRecent && debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) =>
      apiDeleteCatalogSearchHistoryItem(accessToken as string, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["catalog-search-history"] });
      const previous = queryClient.getQueryData<
        ApiSuccessResponse<CatalogSearchHistoryItem[]>
      >(["catalog-search-history"]);
      if (previous) {
        queryClient.setQueryData(["catalog-search-history"], {
          data: previous.data.filter((h) => h.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["catalog-search-history"], ctx.previous);
      }
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => apiDeleteCatalogSearchHistory(accessToken as string),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["catalog-search-history"] });
      const previous = queryClient.getQueryData<
        ApiSuccessResponse<CatalogSearchHistoryItem[]>
      >(["catalog-search-history"]);
      queryClient.setQueryData(["catalog-search-history"], { data: [] });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["catalog-search-history"], ctx.previous);
      }
    },
  });

  if (showRecent && !accessToken) return null;

  const predictive = predictiveQuery.data?.data ?? [];

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 bg-mb-card border border-mb-border rounded-xl shadow-lg p-2 max-h-[400px] overflow-y-auto overflow-x-hidden">
      {showRecent ? (
        <RecentSearchPanel
          items={history.map((h) => ({
            id: h.id,
            label: h.query,
            searchedAt: h.searchedAt,
          }))}
          isLoading={isHistoryLoading}
          emptyLabel={tCommon("noRecentSearches")}
          onSelect={(row) => {
            const original = history.find((h) => h.id === row.id);
            if (original) onSelectRecent(original);
          }}
          onDeleteOne={(id) => deleteOneMutation.mutate(id)}
          onDeleteAll={() => deleteAllMutation.mutate()}
        />
      ) : predictiveQuery.isLoading ? (
        <div className="flex flex-col gap-2 px-2 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-md bg-mb-input shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-mb-input" />
                <div className="h-2.5 w-1/3 rounded bg-mb-input" />
              </div>
            </div>
          ))}
        </div>
      ) : predictive.length === 0 ? (
        <p className="px-2 py-2 text-[13px] text-mb-dim">
          {t("noMatchesFor", { query: debouncedQuery })}
        </p>
      ) : (
        predictive.map((item, i) => (
          <Link
            key={`${item.type}-${item.deezerId}-${i}`}
            href={hrefFor(item)}
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-mb-input"
          >
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt=""
                aria-hidden
                className={
                  item.type === "artist"
                    ? "w-9 h-9 rounded-full object-cover shrink-0"
                    : "w-9 h-9 rounded-md object-cover shrink-0"
                }
              />
            ) : (
              <div
                aria-hidden
                className={
                  item.type === "artist"
                    ? "w-9 h-9 rounded-full shrink-0"
                    : "w-9 h-9 rounded-md shrink-0"
                }
                style={{ background: coverGradient(item.title) }}
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-mb-text truncate">
                {item.title}
              </span>
              <span className="block text-xs text-mb-muted truncate">
                {item.type === "artist"
                  ? item.albumsCount != null
                    ? t("albumsCount", { count: item.albumsCount })
                    : t("typeLabels.artist")
                  : item.artist}
              </span>
            </span>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-mb-dim">
              {t(`typeLabels.${item.type}`)}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
