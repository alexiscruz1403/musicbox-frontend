"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, List, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { coverGradient, getInitials, timeAgo } from "@/lib/review-format";
import { sendReaction } from "@/lib/reactions";
import { tokenStore } from "@/lib/token-store";
import { TIER_COLORS, TIER_LABEL_FG } from "@/lib/tierlist";
import type { ReactionType, Tierlist } from "@/types/api";

const PREVIEW_ROWS = 3;

interface TierlistFeedCardProps {
  tierlist: Tierlist;
  hasSession: boolean;
}

export function TierlistFeedCard({ tierlist, hasSession }: TierlistFeedCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Tierlist");
  const tTiers = useTranslations("Tierlist.tiers");
  const tReviewCard = useTranslations("Reviews.card");
  const [reaction, setReaction] = useState<ReactionType | null>(tierlist.userReaction);
  const [likes, setLikes] = useState(tierlist.likesCount);
  const [dislikes, setDislikes] = useState(tierlist.dislikesCount);
  const [, startTransition] = useTransition();

  const href = `/tierlists/${tierlist.id}`;
  const author = tierlist.user;
  const albumCount =
    tierlist.albumCount ?? tierlist.tiers.reduce((n, row) => n + row.albums.length, 0);
  // Las filas vacías no aportan nada al preview: se muestran las 3 primeras
  // con contenido, en el orden canónico que ya trae el backend.
  const previewRows = tierlist.tiers.filter((row) => row.albums.length > 0).slice(0, PREVIEW_ROWS);

  function handleReact(clicked: ReactionType) {
    if (!hasSession) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const prevReaction = reaction;
    const prevLikes = likes;
    const prevDislikes = dislikes;

    const next = prevReaction === clicked ? null : clicked;
    setReaction(next);
    setLikes(prevLikes + (clicked === "LIKE" ? (next ? 1 : -1) : prevReaction === "LIKE" ? -1 : 0));
    setDislikes(
      prevDislikes + (clicked === "DISLIKE" ? (next ? 1 : -1) : prevReaction === "DISLIKE" ? -1 : 0),
    );

    startTransition(async () => {
      const token = tokenStore.getAccessToken();
      if (!token) {
        setReaction(prevReaction);
        setLikes(prevLikes);
        setDislikes(prevDislikes);
        return;
      }
      try {
        await sendReaction(token, tierlist.id, prevReaction, clicked, "tierlists");
      } catch {
        setReaction(prevReaction);
        setLikes(prevLikes);
        setDislikes(prevDislikes);
      }
    });
  }

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      {/* Autor */}
      <div className="flex items-center gap-2.5 mb-4">
        {author?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt={t("card.avatarAlt", { name: author.displayName })}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            aria-hidden
            className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
          >
            {getInitials(author?.displayName)}
          </span>
        )}
        <div className="min-w-0 flex-1 flex items-baseline gap-1.5 flex-wrap">
          {author?.handle && (
            <Link
              href={`/u/${author.handle}`}
              className="font-mono text-xs text-mb-muted hover:text-mb-accent"
            >
              @{author.handle}
            </Link>
          )}
          <span className="text-sm font-medium text-mb-text">{t("card.madeATierlist")}</span>
          <span className="text-xs text-mb-dim">· {timeAgo(tierlist.createdAt)}</span>
        </div>
      </div>

      {/* Banner del artista */}
      <Link
        href={href}
        className="flex items-center gap-3.5 p-3.5 rounded-xl border border-mb-ddp hover:border-mb-primary transition-colors mb-4"
        style={{ background: "linear-gradient(100deg,#1E0A3C,#160A2E)" }}
      >
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
          <div className="font-serif text-xl text-mb-text leading-tight mt-0.5 truncate">
            {tierlist.externalArtistName}
          </div>
          <div className="text-xs text-mb-muted mt-0.5">
            {t("albumCount", { count: albumCount })}
          </div>
        </div>
      </Link>

      {/* Preview parcial */}
      {previewRows.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-1.5">
          {previewRows.map((row) => (
            <div key={row.tier} className="flex items-stretch gap-1.5 min-h-14">
              <div
                className="shrink-0 w-24 flex items-center justify-center text-center p-1.5 rounded-lg"
                style={{ background: TIER_COLORS[row.tier] }}
              >
                <span
                  className="font-serif text-[13px] leading-tight"
                  style={{ color: TIER_LABEL_FG }}
                >
                  {tTiers(row.tier)}
                </span>
              </div>
              <div className="flex-1 min-w-0 flex flex-wrap content-center gap-1.5 px-2 py-1.5 bg-mb-input rounded-lg">
                {row.albums.map((a) => (
                  <span
                    key={a.id}
                    aria-hidden
                    className="shrink-0 w-11 h-11 rounded-[7px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.45)]"
                    style={{
                      background: a.externalCoverUrl
                        ? `url(${a.externalCoverUrl}) center/cover`
                        : coverGradient(a.deezerId),
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mb-accent hover:underline py-2"
      >
        {t("card.viewFull")}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden />
      </Link>

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-4 mt-3 border-t border-mb-border">
        <button
          type="button"
          onClick={() => handleReact("LIKE")}
          aria-label={t("detail.likeAriaLabel")}
          aria-pressed={reaction === "LIKE"}
          className="inline-flex items-center gap-1.5 min-h-10 px-3 bg-mb-input border border-mb-border rounded-[10px] text-[13px] font-medium hover:border-mb-ddp transition-colors cursor-pointer"
          style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <ThumbsUp
            width={17}
            height={17}
            strokeWidth={1.7}
            fill={reaction === "LIKE" ? "currentColor" : "none"}
          />
          {likes}
        </button>
        <button
          type="button"
          onClick={() => handleReact("DISLIKE")}
          aria-label={t("detail.dislikeAriaLabel")}
          aria-pressed={reaction === "DISLIKE"}
          className="inline-flex items-center gap-1.5 min-h-10 px-3 bg-mb-input border border-mb-border rounded-[10px] text-[13px] font-medium hover:border-mb-ddp transition-colors cursor-pointer"
          style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <ThumbsDown
            width={17}
            height={17}
            strokeWidth={1.7}
            fill={reaction === "DISLIKE" ? "currentColor" : "none"}
          />
          {dislikes}
        </button>
        <Link
          href={href}
          aria-label={t("card.commentsAriaLabel")}
          className="inline-flex items-center gap-1.5 min-h-10 px-3 bg-mb-input border border-mb-border rounded-[10px] text-[13px] font-medium text-mb-muted hover:text-mb-text hover:border-mb-ddp transition-colors"
        >
          <MessageCircle width={17} height={17} strokeWidth={1.7} />
          {tierlist.commentsCount}
          <span className="hidden sm:inline">&nbsp;{tReviewCard("commentsLabel")}</span>
        </Link>
      </div>
    </article>
  );
}
