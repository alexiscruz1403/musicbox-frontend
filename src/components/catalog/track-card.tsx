"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ratingColor, formatMs, coverGradient } from "@/lib/review-format";

export function TrackCard({
  title,
  artist,
  coverUrl,
  deezerId,
  durationMs,
  reviewCount,
  userRating,
}: {
  title: string;
  artist: string;
  coverUrl: string | null;
  deezerId: string;
  durationMs?: number | null;
  reviewCount?: number;
  userRating?: number | null;
}) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  return (
    <Link href={`/track/${deezerId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={tCommon("coverAlt", { title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title })}
          />
        )}
        <div className="absolute inset-0 bg-mb-bg/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-mb-primary text-white font-semibold text-sm rounded-lg">
            {t("viewTrack")}
          </span>
        </div>
        {userRating != null && (
          <span
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-mb-bg/80 border border-mb-ddp font-mono font-bold text-[11px]"
            style={{ color: ratingColor(userRating) }}
          >
            {userRating.toFixed(2)}
          </span>
        )}
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-base leading-tight truncate">
          {title}
        </p>
        <p className="text-mb-muted text-xs mt-0.5 truncate">{artist}</p>
        {durationMs != null && (
          <span className="font-mono text-mb-dim text-xs mt-1 block">
            {formatMs(durationMs)}
          </span>
        )}
        {reviewCount != null && (
          <span className="text-mb-dim text-xs mt-1 block">
            {reviewCount > 0
              ? t("reviewCount", { count: reviewCount })
              : t("noReviewsYet")}
          </span>
        )}
      </div>
    </Link>
  );
}
