"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { coverGradient, formatMs } from "@/lib/review-format";
import type { ArtistTrackItem } from "@/types/api";

export function CatalogTrackRow({ track }: { track: ArtistTrackItem }) {
  const tCommon = useTranslations("Common");
  return (
    <Link
      href={`/track/${track.deezerId}`}
      className="flex items-center gap-3.5 min-h-[56px] px-2.5 py-2 rounded-lg border-b border-mb-border transition-colors hover:bg-[#16161F]"
    >
      <span
        className="shrink-0 w-11 h-11 rounded-md"
        style={
          track.coverUrl
            ? { backgroundImage: `url(${track.coverUrl})`, backgroundSize: "cover" }
            : { background: coverGradient(track.deezerId) }
        }
        role="img"
        aria-label={tCommon("coverAlt", { title: track.title })}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-mb-text truncate">{track.title}</span>
        {track.albumTitle && (
          <span className="block text-xs text-mb-muted truncate">{track.albumTitle}</span>
        )}
      </span>
      {track.durationMs != null && (
        <span className="shrink-0 font-mono text-xs text-mb-dim w-10 text-right">
          {formatMs(track.durationMs)}
        </span>
      )}
    </Link>
  );
}
