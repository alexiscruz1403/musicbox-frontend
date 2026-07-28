"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { CommunityReviewCard } from "@/components/reviews/community-review-card";
import { TierlistFeedCard } from "@/components/tierlists/tierlist-feed-card";
import type { FeedItem } from "@/types/api";

// El feed es multi-recurso desde que existen las tierlists: cada item declara
// su `resourceType` y esta lista ramifica entre las dos cards. Las páginas de
// álbum/canción siguen usando <CommunityReviewList>, que sólo recibe reseñas.

interface FeedListProps {
  items: FeedItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  emptyMessage: string;
  hasSession: boolean;
  hasMore?: boolean;
}

export function FeedList({
  items,
  isLoading,
  isFetchingNextPage,
  sentinelRef,
  emptyMessage,
  hasSession,
  hasMore = true,
}: FeedListProps) {
  const t = useTranslations("Reviews.card");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-mb-card border border-mb-border rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-mb-input" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-mb-input" />
                <div className="h-3 w-1/4 rounded bg-mb-input" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded bg-mb-input" />
              <div className="h-3 w-4/5 rounded bg-mb-input" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-mb-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {items.map((item) =>
          item.resourceType === "TIERLIST" ? (
            <TierlistFeedCard key={item.id} tierlist={item} hasSession={hasSession} />
          ) : (
            <CommunityReviewCard key={item.id} review={item} hasSession={hasSession} />
          ),
        )}
      </div>
      <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
        {isFetchingNextPage ? (
          <div
            className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
            aria-label={t("loadingMoreAriaLabel")}
          />
        ) : (
          !hasMore && <p className="text-mb-dim text-sm">{t("allCaughtUp")}</p>
        )}
      </div>
    </>
  );
}
