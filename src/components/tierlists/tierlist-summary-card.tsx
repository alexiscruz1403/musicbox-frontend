"use client";

import Link from "next/link";
import { ChevronRight, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { coverGradient, timeAgo } from "@/lib/review-format";
import { TIER_COLORS, flattenTiers } from "@/lib/tierlist";
import type { Tierlist } from "@/types/api";

const PREVIEW_LIMIT = 5;

interface TierlistSummaryCardProps {
  tierlist: Tierlist;
}

export function TierlistSummaryCard({ tierlist }: TierlistSummaryCardProps) {
  const t = useTranslations("Tierlist");
  const tTiers = useTranslations("Tierlist.tiers");

  // Los 7 tiers vienen completos en el listado (ver docs/tierlist-features.md),
  // así que el preview no cuesta ninguna request extra.
  const albums = flattenTiers(tierlist.tiers);
  const shown = albums.slice(0, PREVIEW_LIMIT);
  const more = albums.length - shown.length;

  return (
    <Link
      href={`/tierlists/${tierlist.id}`}
      className="block bg-mb-card border border-mb-border rounded-xl p-4.5 hover:border-mb-ddp transition-colors"
    >
      <div className="flex items-center gap-3.5 mb-4">
        {tierlist.externalArtistImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tierlist.externalArtistImageUrl}
            alt={t("card.artistImageAlt", { name: tierlist.externalArtistName })}
            className="shrink-0 w-13 h-13 rounded-xl object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="shrink-0 w-13 h-13 rounded-xl shadow-[inset_2px_2px_6px_rgba(0,0,0,0.45)]"
            style={{ background: coverGradient(tierlist.artist.deezerId) }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <List className="w-3.5 h-3.5 text-mb-accent" aria-hidden />
            <span className="text-[11px] tracking-wider uppercase text-mb-accent font-semibold">
              {t("typeBadge")}
            </span>
          </div>
          <div className="font-serif text-lg text-mb-text leading-tight mt-0.5 truncate">
            {tierlist.externalArtistName}
          </div>
          <div className="text-xs text-mb-dim mt-0.5">
            {t("card.createdAt", { time: timeAgo(tierlist.createdAt) })}
          </div>
        </div>
        <ChevronRight className="shrink-0 w-4.5 h-4.5 text-mb-dim" aria-hidden />
      </div>

      {shown.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center">
          {shown.map((a) => (
            <span key={a.deezerId} className="relative shrink-0">
              <span
                role="img"
                aria-label={t("coverAlt", { title: a.title, tier: tTiers(a.tier) })}
                title={tTiers(a.tier)}
                className="block w-13 h-13 rounded-[9px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.45)]"
                style={{
                  background: a.coverUrl
                    ? `url(${a.coverUrl}) center/cover`
                    : coverGradient(a.deezerId),
                }}
              />
              <span
                aria-hidden
                className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-[2.5px] border-mb-card shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                style={{ background: TIER_COLORS[a.tier] }}
              />
            </span>
          ))}
          {more > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center w-13 h-13 rounded-[9px] bg-mb-input border border-mb-border font-mono text-[13px] font-bold text-mb-muted">
              {t("card.moreAlbums", { count: more })}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
