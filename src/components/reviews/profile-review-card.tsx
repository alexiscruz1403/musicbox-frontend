"use client";

import Link from "next/link";
import { ratingColor, timeAgo, coverGradient } from "@/lib/review-format";
import type { UserReviewHistoryItem } from "@/types/api";

export function ProfileReviewCard({ item }: { item: UserReviewHistoryItem }) {
  const rating = Number(item.rating);

  return (
    <Link
      href={`/reviews/${item.id}`}
      className="flex gap-3.5 bg-mb-card border border-mb-border rounded-xl p-4 hover:border-mb-ddp transition-colors"
    >
      <div className="relative shrink-0 w-16 h-16">
        <div
          className="w-16 h-16 rounded-lg"
          style={
            item.externalCoverUrl
              ? { backgroundImage: `url(${item.externalCoverUrl})`, backgroundSize: "cover" }
              : { background: coverGradient(item.id) }
          }
          role="img"
          aria-label={`Cover de ${item.externalTitle ?? ""}`}
        />
        {item.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatarUrl}
            alt=""
            aria-hidden
            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full object-cover border-2 border-mb-card"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-mb-text text-base leading-tight truncate">
              {item.externalTitle ?? "—"}
            </p>
            <p className="text-mb-muted text-xs mt-0.5 truncate">
              {item.externalArtistName ?? ""} · {timeAgo(item.createdAt)}
            </p>
          </div>
          <span
            className="shrink-0 font-mono font-bold text-lg leading-none"
            style={{ color: ratingColor(rating) }}
          >
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-mb-muted mt-2 line-clamp-2">{item.description}</p>
      </div>
    </Link>
  );
}
