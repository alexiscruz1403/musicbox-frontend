"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { CommunityReviewCard } from "@/components/reviews/community-review-card";
import type { CatalogReview } from "@/types/api";

interface CommunityReviewListProps {
  reviews: CatalogReview[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  emptyMessage: string;
  clampDescription?: boolean;
  hasSession: boolean;
  hasMore?: boolean;
}

export function CommunityReviewList({
  reviews,
  isLoading,
  isFetchingNextPage,
  sentinelRef,
  emptyMessage,
  clampDescription,
  hasSession,
  hasMore = true,
}: CommunityReviewListProps) {
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

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-mb-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {reviews.map((r) => (
          <CommunityReviewCard
            key={r.id}
            review={r}
            clampDescription={clampDescription}
            hasSession={hasSession}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
        {isFetchingNextPage ? (
          <div
            className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
            aria-label={t("loadingMoreAriaLabel")}
          />
        ) : (
          !hasMore && (
            <p className="text-mb-dim text-sm">{t("allCaughtUp")}</p>
          )
        )}
      </div>
    </>
  );
}
