"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ratingColor, timeAgo, getInitials } from "@/lib/review-format";
import type { CatalogReview } from "@/types/api";

interface CommunityReviewCardProps {
  review: CatalogReview;
  clampDescription?: boolean;
}

export function CommunityReviewCard({
  review,
  clampDescription = true,
}: CommunityReviewCardProps) {
  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(
    review.userReaction,
  );

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <Link href={`/reviews/${review.id}`} className="contents">
          {review.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.avatarUrl}
              alt={`Avatar de ${review.user.displayName}`}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <span
              aria-hidden
              className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
            >
              {getInitials(review.user.displayName)}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1 flex items-baseline gap-1.5 flex-wrap">
          <Link
            href={`/reviews/${review.id}`}
            className="text-sm font-medium text-mb-text hover:text-mb-accent"
          >
            {review.user.displayName}
          </Link>
          <Link
            href={`/u/${review.user.handle}`}
            className="font-mono text-xs text-mb-muted hover:text-mb-accent"
          >
            @{review.user.handle}
          </Link>
          <span className="text-xs text-mb-dim">· {timeAgo(review.createdAt)}</span>
        </div>
        <span
          className="shrink-0 font-mono font-bold text-[26px] leading-none"
          style={{ color: ratingColor(review.rating) }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      <Link href={`/reviews/${review.id}`}>
        <p
          className={cn(
            "text-[15px] leading-relaxed text-mb-text mb-3.5",
            clampDescription && "line-clamp-4",
          )}
        >
          {review.description}
        </p>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setReaction((r) => (r === "LIKE" ? null : "LIKE"))}
          aria-label="Me gusta"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M7 10l4-7a2.5 2.5 0 0 1 3 2.5L13.5 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>
          {review.likesCount + (reaction === "LIKE" ? 1 : 0)}
        </button>
        <button
          type="button"
          onClick={() => setReaction((r) => (r === "DISLIKE" ? null : "DISLIKE"))}
          aria-label="No me gusta"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3"/><path d="M17 14l-4 7a2.5 2.5 0 0 1-3-2.5L10.5 15H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17"/></svg>
          {review.dislikesCount + (reaction === "DISLIKE" ? 1 : 0)}
        </button>
        <Link
          href={`/reviews/${review.id}`}
          aria-label="Comentarios"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8 8 0 0 1-11.7 7L3 21l2.5-6.3A8 8 0 1 1 21 11.5Z"/></svg>
          {review.commentsCount}
        </Link>
      </div>
    </article>
  );
}
