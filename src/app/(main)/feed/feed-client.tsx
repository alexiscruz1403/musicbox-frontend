"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFeed } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CommunityReviewList } from "@/components/reviews/community-review-list";
import { FollowSuggestionsWidget } from "@/components/feed/follow-suggestions-widget";
import { TrendingWidget } from "@/components/feed/trending-widget";
import { UserSearchWidget } from "@/components/feed/user-search-widget";
import type { FeedType } from "@/types/api";

interface FeedClientProps {
  accessToken: string;
}

const TABS: { id: FeedType; label: string }[] = [
  { id: "FOLLOWED", label: "Seguidos" },
  { id: "ALL", label: "Descubrir" },
];

function EmptyFeed({ feedType }: { feedType: FeedType }) {
  if (feedType === "ALL") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <p className="text-mb-muted text-sm">No hay reseñas para descubrir por ahora.</p>
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
        Tu feed está vacío por ahora
      </h2>
      <p className="text-[15px] leading-relaxed text-mb-muted max-w-[380px]">
        Buscá oyentes con buen gusto y seguílos. Sus reseñas van a empezar a aparecer acá.
      </p>
    </div>
  );
}

export function FeedClient({ accessToken }: FeedClientProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [feedType, setFeedType] = useState<FeedType>("FOLLOWED");

  const {
    data: feedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: feedFetching,
  } = useInfiniteQuery({
    queryKey: ["feed", feedType],
    queryFn: ({ pageParam }) => apiFeed(accessToken, feedType, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });

  const reviews = (feedPages?.pages ?? []).flatMap((p) => p.data.items);
  const isLoading = feedFetching && reviews.length === 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <div className="max-w-[1040px] mx-auto px-6 md:px-[clamp(20px,3vw,48px)] py-9 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main feed */}
        <main className="min-w-0">
          <header className="mb-7">
            <h1 className="font-serif font-normal text-[32px] leading-tight text-mb-text mb-1.5">
              Tu feed
            </h1>
            <p className="text-[15px] text-mb-muted">Reseñas de personas que seguís</p>
          </header>

          <UserSearchWidget accessToken={accessToken} />

          {/* Tabs */}
          <div className="flex gap-1 border-b border-mb-border mb-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFeedType(t.id)}
                className={cn(
                  "h-11 px-4 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                  feedType === t.id
                    ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                    : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
                )}
              >
                {t.label}
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
              emptyMessage="Todavía no ves reseñas en tu feed. Seguí a alguien para empezar."
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
