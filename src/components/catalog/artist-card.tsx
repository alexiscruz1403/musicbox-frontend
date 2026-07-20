"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { getInitials, coverGradient } from "@/lib/review-format";
import type { CatalogArtist } from "@/types/api";

export function ArtistCard({ artist }: { artist: CatalogArtist }) {
  const t = useTranslations("Search");
  return (
    <Link
      href={`/artist/${artist.deezerId}`}
      className="flex flex-col items-center gap-3 bg-mb-card border border-mb-border rounded-xl p-6 hover:border-mb-ddp transition-colors"
    >
      {artist.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-20 h-20 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-2xl text-mb-accent"
          style={{ background: coverGradient(artist.deezerId) }}
          aria-hidden
        >
          {getInitials(artist.name)}
        </div>
      )}
      <p className="font-semibold text-mb-text text-sm text-center">
        {artist.name}
      </p>
      {artist.reviewCount != null && (
        <p className="text-mb-dim text-xs -mt-1">
          {t("reviewCount", { count: artist.reviewCount })}
        </p>
      )}
    </Link>
  );
}
