"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getInitials, coverGradient } from "@/lib/review-format";
import type { RecentlyViewedItem } from "@/types/api";

export function RecentlyViewedCard({ item }: { item: RecentlyViewedItem }) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const type = item.resourceType.toUpperCase();
  const isAlbum = type === "ALBUM";
  const isTrack = type === "TRACK";
  const isArtist = !isAlbum && !isTrack;

  const href = isAlbum
    ? `/album/${item.deezerId}`
    : isTrack
      ? `/track/${item.deezerId}`
      : `/artist/${item.deezerId}`;

  const subtitle = isArtist
    ? item.albumsCount != null
      ? t("albumsCount", { count: item.albumsCount })
      : t("typeLabels.artist")
    : item.artistName;

  const typeLabel = isAlbum ? t("typeLabels.album") : isTrack ? t("typeLabels.track") : null;

  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative overflow-hidden",
          isArtist ? "rounded-full aspect-square" : "rounded-xl aspect-square",
        )}
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt={tCommon("coverAlt", { title: item.title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif text-xl text-mb-accent"
            style={{ background: coverGradient(item.deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title: item.title })}
          >
            {isArtist ? getInitials(item.title) : ""}
          </div>
        )}
        {typeLabel && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-mb-bg/70 text-[9px] font-semibold uppercase tracking-wide text-mb-accent">
            {typeLabel}
          </span>
        )}
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-base leading-tight truncate">
          {item.title}
        </p>
        <p className="text-mb-muted text-xs mt-0.5 truncate">{subtitle}</p>
      </div>
    </Link>
  );
}
