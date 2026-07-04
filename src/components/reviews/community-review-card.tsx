"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
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

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <Link href={`/reviews/${review.id}`} className="contents">
          {review.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.avatarUrl}
              alt={`Avatar de ${review.user.displayName}`}
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
            href={`/reviews/${review.id}`}
            className="text-sm font-medium text-mb-text hover:text-mb-accent"
          >
            {review.user.displayName}
          </Link>
          <Link
            href={`/u/${review.user.handle}`}
            className="font-mono text-xs text-mb-muted hover:text-mb-accent"
          >
            @{review.user.handle}
          </Link>
          <span className="text-xs text-mb-dim">· {timeAgo(review.createdAt)}</span>
        </div>
        <span
          className="shrink-0 font-mono font-bold text-[26px] leading-none"
          style={{ color: ratingColor(review.rating) }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      {targetHref && (
        <Link
          href={targetHref}
          className="flex items-center gap-3 p-2.5 bg-mb-input rounded-lg mb-3.5 hover:bg-mb-border transition-colors"
        >
          <div
            className="shrink-0 w-12 h-12 rounded-md"
            style={
              review.externalCoverUrl
                ? { backgroundImage: `url(${review.externalCoverUrl})`, backgroundSize: "cover" }
                : { background: coverGradient(review.id) }
            }
            role="img"
            aria-label={`Cover de ${review.externalTitle ?? ""}`}
          />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[15px] text-mb-text truncate">
              {review.externalTitle ?? "—"}
            </div>
            <div className="text-xs text-mb-muted truncate">{review.externalArtistName ?? ""}</div>
          </div>
        </Link>
      )}

      <Link href={`/reviews/${review.id}`}>
        <p
          className={cn(
            "text-[15px] leading-relaxed text-mb-text mb-3.5",
            clampDescription && "line-clamp-4",
          )}
        >
          {review.description}
        </p>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleReact("LIKE")}
          aria-label="Me gusta"
          aria-pressed={reaction === "LIKE"}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <ThumbsUp
            width={17}
            height={17}
            strokeWidth={1.75}
            fill={reaction === "LIKE" ? "currentColor" : "none"}
          />
          {likes}
        </button>
        <button
          type="button"
          onClick={() => handleReact("DISLIKE")}
          aria-label="No me gusta"
          aria-pressed={reaction === "DISLIKE"}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <ThumbsDown
            width={17}
            height={17}
            strokeWidth={1.75}
            fill={reaction === "DISLIKE" ? "currentColor" : "none"}
          />
          {dislikes}
        </button>
        <Link
          href={`/reviews/${review.id}`}
          aria-label="Comentarios"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors"
        >
          <MessageCircle width={17} height={17} strokeWidth={1.75} />
          {review.commentsCount}
        </Link>
      </div>
    </article>
  );
}
