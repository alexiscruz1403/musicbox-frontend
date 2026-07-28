"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ratingColor, timeAgo, getInitials, coverGradient } from "@/lib/review-format";
import { sendReaction } from "@/lib/reactions";
import { tokenStore } from "@/lib/token-store";
import type { CatalogReview, ReactionType } from "@/types/api";

interface CommunityReviewCardProps {
  review: CatalogReview;
  clampDescription?: boolean;
  hasSession: boolean;
}

export function CommunityReviewCard({
  review,
  clampDescription = true,
  hasSession,
}: CommunityReviewCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Reviews.card");
  const tCommon = useTranslations("Common");
  const [reaction, setReaction] = useState<ReactionType | null>(review.userReaction);
  const [likes, setLikes] = useState(review.likesCount);
  const [dislikes, setDislikes] = useState(review.dislikesCount);
  const [, startTransition] = useTransition();

  const targetHref =
    review.targetDeezerId && review.targetType
      ? review.targetType === "ALBUM"
        ? `/album/${review.targetDeezerId}`
        : `/track/${review.targetDeezerId}`
      : null;

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
        await sendReaction(token, review.id, prevReaction, clicked);
      } catch {
        setReaction(prevReaction);
        setLikes(prevLikes);
        setDislikes(prevDislikes);
      }
    });
  }

  // Sólo los contextos que abarcan varios targets (el feed) mandan estos
  // campos; en el detalle de álbum/canción el target es implícito de la página.
  const hasTarget = !!review.externalTitle;
  const coverAlt = tCommon("coverAlt", { title: review.externalTitle ?? "" });
  const coverClass =
    "shrink-0 block w-15 h-15 sm:w-20 sm:h-20 rounded-[10px] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]";
  const coverStyle = review.externalCoverUrl
    ? { backgroundImage: `url(${review.externalCoverUrl})`, backgroundSize: "cover" }
    : { background: coverGradient(review.id) };
  const titleClass = "block font-serif text-xl leading-tight text-mb-text truncate";

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      {/* Autor */}
      <div className="flex items-center gap-2.5 mb-4">
        <Link href={`/u/${review.user.handle}`} className="contents">
          {review.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.avatarUrl}
              alt={t("avatarAlt", { name: review.user.displayName })}
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
            href={`/u/${review.user.handle}`}
            className="font-mono text-[13px] text-mb-muted hover:text-mb-accent"
          >
            @{review.user.handle}
          </Link>
          <span className="text-[13px] font-medium text-mb-text">
            {review.user.displayName}
          </span>
          <span className="text-xs text-mb-dim">· {timeAgo(review.createdAt)}</span>
        </div>
        {/* Sin fila de álbum (detalle de álbum/canción, donde el target es
            implícito) la puntuación no tiene dónde ir: se queda acá. */}
        {!hasTarget && (
          <span
            className="shrink-0 font-mono font-bold text-[26px] leading-none"
            style={{ color: ratingColor(review.rating) }}
          >
            {review.rating.toFixed(2)}
          </span>
        )}
      </div>

      {/* Álbum/canción reseñada. El feed manda externalTitle/externalArtistName/
          externalCoverUrl pero no el álbum/canción anidado del que sale el
          deezerId, así que la fila se muestra igual y sólo se vuelve un link
          cuando hay a dónde ir. */}
      {hasTarget && (
        <div className="flex gap-4 mb-4">
          {targetHref ? (
            <Link
              href={targetHref}
              aria-label={coverAlt}
              className={cn(coverClass, "transition-transform hover:scale-[1.04]")}
              style={coverStyle}
            />
          ) : (
            <div role="img" aria-label={coverAlt} className={coverClass} style={coverStyle} />
          )}
          <div className="min-w-0 flex-1">
            {targetHref ? (
              <Link href={targetHref} className={cn(titleClass, "hover:text-mb-accent transition-colors")}>
                {review.externalTitle}
              </Link>
            ) : (
              <span className={titleClass}>{review.externalTitle}</span>
            )}
            <div className="text-sm text-mb-muted truncate mt-0.5 mb-2.5">
              {review.externalArtistName ?? ""}
            </div>
            <span
              className="font-mono font-bold text-[26px] leading-none"
              style={{ color: ratingColor(review.rating) }}
            >
              {review.rating.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {review.description && (
        <p
          className={cn(
            "text-[15px] leading-relaxed text-mb-text mb-1.5",
            clampDescription && (hasTarget ? "line-clamp-2" : "line-clamp-4"),
          )}
        >
          {review.description}
        </p>
      )}

      <Link
        href={`/reviews/${review.id}`}
        className="inline-block text-sm font-medium text-mb-accent hover:underline"
      >
        {t("viewMore")} →
      </Link>

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-4 mt-3 border-t border-mb-border">
        <button
          type="button"
          onClick={() => handleReact("LIKE")}
          aria-label={t("likeAriaLabel")}
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
          aria-label={t("dislikeAriaLabel")}
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
          href={`/reviews/${review.id}`}
          aria-label={t("commentsAriaLabel")}
          className="inline-flex items-center gap-1.5 min-h-10 px-3 bg-mb-input border border-mb-border rounded-[10px] text-[13px] font-medium text-mb-muted hover:text-mb-text hover:border-mb-ddp transition-colors"
        >
          <MessageCircle width={17} height={17} strokeWidth={1.7} />
          {review.commentsCount}
          <span className="hidden sm:inline">&nbsp;{t("commentsLabel")}</span>
        </Link>
      </div>
    </article>
  );
}
