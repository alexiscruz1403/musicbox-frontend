"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { coverGradient } from "@/lib/review-format";
import type { CatalogAlbum } from "@/types/api";

export function CatalogAlbumTile({ album }: { album: CatalogAlbum }) {
  const tCommon = useTranslations("Common");
  return (
    <Link href={`/album/${album.deezerId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverUrl}
            alt={tCommon("coverAlt", { title: album.title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(album.deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title: album.title })}
          />
        )}
      </div>
      <p className="mt-2.5 font-serif text-mb-text text-sm leading-tight truncate">
        {album.title}
      </p>
    </Link>
  );
}
