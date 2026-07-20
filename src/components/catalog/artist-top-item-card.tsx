"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ratingColor, coverGradient } from "@/lib/review-format";

export function ArtistTopItemCard({
  title,
  href,
  coverUrl,
  deezerId,
  avgRating,
  reviewCount,
}: {
  title: string;
  href: string;
  coverUrl: string | null;
  deezerId: string;
  avgRating: number | null;
  reviewCount: number;
}) {
  const t = useTranslations("Artist");
  const tCommon = useTranslations("Common");
  return (
    <Link href={href} className="group block">
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
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-[15px] leading-tight truncate">
          {title}
        </p>
        <span className="flex items-center gap-1.5 mt-1">
          {avgRating != null ? (
            <>
              <span
                className="font-mono font-bold text-xs"
                style={{ color: ratingColor(avgRating) }}
              >
                {avgRating.toFixed(2)}
              </span>
              <span className="text-mb-dim text-[11px]">
                {t("reviewCount", { count: reviewCount })}
              </span>
            </>
          ) : (
            <span className="text-mb-dim text-xs">{t("noReviews")}</span>
          )}
        </span>
      </div>
    </Link>
  );
}
