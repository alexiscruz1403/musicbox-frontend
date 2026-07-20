"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiFeed } from "@/lib/api";
import { useOfflineListQuery } from "@/hooks/use-offline-list-query";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";
import { cn } from "@/lib/utils";
import { CommunityReviewList } from "@/components/reviews/community-review-list";
import { FollowSuggestionsWidget } from "@/components/feed/follow-suggestions-widget";
import { TrendingWidget } from "@/components/feed/trending-widget";
import { UserSearchWidget } from "@/components/feed/user-search-widget";
import type { FeedType } from "@/types/api";

interface FeedClientProps {
  accessToken: string;
}

function EmptyFeed({ feedType }: { feedType: FeedType }) {
  const t = useTranslations("Feed");

  if (feedType === "ALL") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <p className="text-mb-muted text-sm">{t("emptyDiscover")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div aria-hidden className="flex items-end gap-1.5 h-16 mb-6 opacity-90">
        {[24, 48, 34, 60, 40, 22, 52].map((h, i) => (
          <span
            key={i}
            className="w-[5px] rounded-full"
            style={{ height: h, background: i % 2 === 0 ? "#3D1A7A" : "#6B35D4" }}
          />
        ))}
      </div>
      <h2 className="font-serif font-normal text-2xl text-mb-text mb-2.5">
        {t("emptyFollowedHeading")}
      </h2>
      <p className="text-[15px] leading-relaxed text-mb-muted max-w-[380px]">
        {t("emptyFollowedBody")}
      </p>
    </div>
  );
}

export function FeedClient({ accessToken }: FeedClientProps) {
  const t = useTranslations("Feed");
  const [feedType, setFeedType] = useState<FeedType>("FOLLOWED");

  const TABS: { id: FeedType; label: string }[] = [
    { id: "FOLLOWED", label: t("tabFollowed") },
    { id: "ALL", label: t("tabDiscover") },
  ];

  const {
    items: reviews,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useOfflineListQuery({
    queryKey: ["feed", feedType],
    cacheKey: `feed:${feedType}`,
    fetchPage: async (cursor) => {
      const { data } = await apiFeed(accessToken, feedType, cursor);
      return data;
    },
  });

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <div className="max-w-[1040px] mx-auto px-6 md:px-[clamp(20px,3vw,48px)] py-9 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main feed */}
        <main className="min-w-0">
          <header className="mb-7">
            <h1 className="font-serif font-normal text-[32px] leading-tight text-mb-text mb-1.5">
              {t("heading")}
            </h1>
            <p className="text-[15px] text-mb-muted">{t("subheading")}</p>
          </header>

          <UserSearchWidget accessToken={accessToken} />

          {/* Tabs */}
          <div className="flex gap-1 border-b border-mb-border mb-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedType(tab.id)}
                className={cn(
                  "h-11 px-4 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                  feedType === tab.id
                    ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                    : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isLoading && reviews.length === 0 ? (
            <EmptyFeed feedType={feedType} />
          ) : (
            <CommunityReviewList
              reviews={reviews}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              sentinelRef={sentinelRef}
              emptyMessage={t("emptyFeedMessage")}
              hasSession
              hasMore={hasNextPage}
            />
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:flex flex-col gap-6">
          <FollowSuggestionsWidget accessToken={accessToken} />
          <TrendingWidget />
        </aside>
      </div>
    </div>
  );
}
