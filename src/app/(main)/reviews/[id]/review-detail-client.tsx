"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Pencil, Trash2, Flag, ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiDeleteReview, generateIdempotencyKey, ApiError } from "@/lib/api";
import { sendReaction } from "@/lib/reactions";
import { ratingColor, timeAgo, getInitials, coverGradient } from "@/lib/review-format";
import { CommentsSection } from "@/components/social/comments-section";
import { ReportModal } from "@/components/reports/report-modal";
import type { ReviewDetail, ReactionType, ReportTargetType } from "@/types/api";

interface ReportTarget {
  targetType: ReportTargetType;
  targetId: string;
  previewTitle: string;
  previewSubtitle?: string;
}

interface ReviewDetailClientProps {
  review: ReviewDetail;
  currentUserId?: string;
  currentUserHandle?: string;
  currentUserDisplayName?: string;
  accessToken?: string;
}

export function ReviewDetailClient({
  review,
  currentUserId,
  currentUserHandle,
  currentUserDisplayName,
  accessToken,
}: ReviewDetailClientProps) {
  const router = useRouter();
  const t = useTranslations("Reviews.detail");
  const tCommon = useTranslations("Common");
  const isOwner = !!currentUserId && currentUserId === review.userId;

  const [reaction, setReaction] = useState<ReactionType | null>(review.userReaction);
  const [likes, setLikes] = useState(review.likesCount);
  const [dislikes, setDislikes] = useState(review.dislikesCount);
  const [commentsCount, setCommentsCount] = useState(review.commentsCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startReactionTransition] = useTransition();

  const rating = Number(review.rating);

  const targetKind = review.type === "ALBUM" ? "album" : "track";
  const targetHref = review.targetDeezerId ? `/${targetKind}/${review.targetDeezerId}` : null;
  const editHref = review.targetDeezerId
    ? `/${targetKind}/${review.targetDeezerId}/review/new?edit=${review.id}`
    : null;

  function handleReact(clicked: ReactionType) {
    if (!accessToken) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/reviews/${review.id}`)}`);
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

    startReactionTransition(async () => {
      try {
        await sendReaction(accessToken, review.id, prevReaction, clicked);
      } catch {
        setReaction(prevReaction);
        setLikes(prevLikes);
        setDislikes(prevDislikes);
      }
    });
  }

  function handleDelete() {
    if (!accessToken) return;
    if (!window.confirm(t("confirmDeleteReview"))) {
      return;
    }
    setDeleteError(null);
    const afterDelete = currentUserHandle ? `/u/${currentUserHandle}` : "/";
    startTransition(async () => {
      try {
        await apiDeleteReview(accessToken, review.id, generateIdempotencyKey());
        router.push(afterDelete);
        router.refresh();
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "REVIEW_NOT_FOUND") {
          router.push(afterDelete);
          router.refresh();
          return;
        }
        setDeleteError(
          apiErr.code === "NOT_REVIEW_OWNER"
            ? t("deleteNotOwnerError")
            : apiErr.message || t("deleteReviewError"),
        );
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={tCommon("back")}
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-[780px] mx-auto px-6 md:px-[clamp(20px,5vw,40px)] pt-[72px] pb-24">
        {/* Reviewer header */}
        <div className="flex items-center gap-3.5 mb-7">
          <span
            aria-hidden
            className="shrink-0 w-12 h-12 rounded-full bg-mb-dp flex items-center justify-center text-base font-semibold text-mb-accent"
          >
            {getInitials(review.user.displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-semibold text-mb-text truncate">
                {review.user.displayName}
              </span>
              {review.user.handle && (
                <Link
                  href={`/u/${review.user.handle}`}
                  className="font-mono text-[13px] text-mb-muted hover:text-mb-accent"
                >
                  @{review.user.handle}
                </Link>
              )}
            </div>
            <div className="text-[13px] text-mb-dim mt-0.5">{timeAgo(review.createdAt)}</div>
          </div>

          {isOwner && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("moreOptionsAriaLabel")}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
              >
                <MoreVertical className="w-[18px] h-[18px]" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 z-20 bg-mb-input border border-mb-border rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-1.5 min-w-[180px]">
                  {editHref && (
                    <Link
                      href={editHref}
                      className="flex items-center gap-2.5 w-full min-h-10 px-3 py-2 rounded-md text-mb-text text-sm hover:bg-mb-border transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      {t("editAction")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex items-center gap-2.5 w-full min-h-10 px-3 py-2 rounded-md text-mb-error text-sm text-left hover:bg-mb-border transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isPending ? t("deletingLabel") : t("deleteAction")}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isOwner && accessToken && (
            <button
              type="button"
              onClick={() =>
                setReportTarget({
                  targetType: "REVIEW",
                  targetId: review.id,
                  previewTitle: review.externalTitle
                    ? t("reportPreviewTitleWithName", { title: review.externalTitle })
                    : t("reportPreviewTitleFallback"),
                  previewSubtitle: review.user.handle
                    ? t("byHandle", { handle: review.user.handle })
                    : undefined,
                })
              }
              aria-label={t("reportReviewAriaLabel")}
              className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-error transition-colors cursor-pointer"
            >
              <Flag className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>

        {deleteError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {deleteError}
          </div>
        )}

        {/* Target context card */}
        {(targetHref ? (
          <Link
            href={targetHref}
            className="flex items-center gap-3.5 p-3.5 bg-mb-card border border-mb-border rounded-lg mb-8 hover:border-mb-ddp transition-colors"
          >
            <div
              className="shrink-0 w-16 h-16 rounded-lg"
              style={
                review.externalCoverUrl
                  ? { backgroundImage: `url(${review.externalCoverUrl})`, backgroundSize: "cover" }
                  : { background: coverGradient(review.id) }
              }
              role="img"
              aria-label={tCommon("coverAlt", { title: review.externalTitle ?? "" })}
            />
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 border border-mb-ddp rounded-full text-[10px] tracking-wider uppercase text-mb-accent font-semibold mb-1.5">
                {review.type === "ALBUM" ? t("typeAlbum") : t("typeTrack")}
              </span>
              <div className="font-serif text-lg text-mb-text truncate">
                {review.externalTitle ?? "—"}
              </div>
              <div className="text-[13px] text-mb-muted mt-0.5 truncate">
                {review.externalArtistName ?? ""}
              </div>
            </div>
            <span
              className="shrink-0 font-mono font-bold text-[15px] rounded-md px-2.5 py-1.5"
              style={{ color: "#0A0A0F", background: ratingColor(rating) }}
            >
              {rating.toFixed(2)}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3.5 p-3.5 bg-mb-card border border-mb-border rounded-lg mb-8">
            <div
              className="shrink-0 w-16 h-16 rounded-lg"
              style={{ background: coverGradient(review.id) }}
            />
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 border border-mb-ddp rounded-full text-[10px] tracking-wider uppercase text-mb-accent font-semibold mb-1.5">
                {review.type === "ALBUM" ? t("typeAlbum") : t("typeTrack")}
              </span>
              <div className="font-serif text-lg text-mb-text truncate">
                {review.externalTitle ?? "—"}
              </div>
              <div className="text-[13px] text-mb-muted mt-0.5 truncate">
                {review.externalArtistName ?? ""}
              </div>
            </div>
          </div>
        ))}

        {/* Main rating + body */}
        <div className="flex items-baseline gap-2.5 mb-5">
          <span
            className="font-mono font-bold text-7xl leading-[0.9]"
            style={{ color: ratingColor(rating) }}
          >
            {rating.toFixed(2)}
          </span>
          <span className="font-mono text-lg text-mb-dim">/10</span>
        </div>

        {review.description && (
          <div className="text-[15px] leading-[1.75] text-mb-text mb-10 whitespace-pre-wrap">
            {review.description}
          </div>
        )}

        {/* Per-track ratings */}
        {review.type === "ALBUM" && review.trackReviewItems && review.trackReviewItems.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif font-normal text-[22px] text-mb-text mb-4.5">
              {t("perTrackRatingsHeading")}
            </h2>
            <div className="flex flex-col gap-4">
              {review.trackReviewItems.map((item, i) => (
                <div key={item.deezerId ?? item.trackNumber ?? i}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="min-w-0 flex-1 text-sm text-mb-text truncate">
                      {item.title ?? t("trackFallbackLabel", { number: item.trackNumber ?? i + 1 })}
                    </span>
                    <span
                      className="shrink-0 font-mono font-bold text-sm"
                      style={{ color: ratingColor(item.rating) }}
                    >
                      {item.rating.toFixed(2)}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={t("ratingAriaLabel", { rating: item.rating.toFixed(2) })}
                    className="h-1.5 rounded-full bg-mb-input overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${item.rating * 10}%`, background: ratingColor(item.rating) }}
                    />
                  </div>
                  {item.description && (
                    <p className="text-[13px] italic text-mb-muted mt-1.5 leading-relaxed">
                      “{item.description}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1.5 py-3.5 border-t border-b border-mb-border mb-9 flex-wrap">
          <button
            type="button"
            onClick={() => handleReact("LIKE")}
            aria-label={t("likeAriaLabel")}
            aria-pressed={reaction === "LIKE"}
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors cursor-pointer"
            style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
          >
            <ThumbsUp width={18} height={18} strokeWidth={1.75} fill={reaction === "LIKE" ? "currentColor" : "none"} />
            {likes}
          </button>
          <button
            type="button"
            onClick={() => handleReact("DISLIKE")}
            aria-label={t("dislikeAriaLabel")}
            aria-pressed={reaction === "DISLIKE"}
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors cursor-pointer"
            style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
          >
            <ThumbsDown width={18} height={18} strokeWidth={1.75} fill={reaction === "DISLIKE" ? "currentColor" : "none"} />
            {dislikes}
          </button>
          <span className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium text-mb-muted">
            <MessageCircle width={18} height={18} strokeWidth={1.75} />
            {commentsCount}
          </span>
        </div>

        {/* Comments */}
        <CommentsSection
          target="reviews"
          targetId={review.id}
          commentsCount={commentsCount}
          onCommentsCountChange={(delta) => setCommentsCount((c) => c + delta)}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          accessToken={accessToken}
          onReport={(target) =>
            setReportTarget({
              targetType: "COMMENT",
              targetId: target.commentId,
              previewTitle: target.content.slice(0, 140),
              previewSubtitle: target.handle ? t("byHandle", { handle: target.handle }) : undefined,
            })
          }
        />
      </div>

      {reportTarget && accessToken && (
        <ReportModal
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          accessToken={accessToken}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          previewTitle={reportTarget.previewTitle}
          previewSubtitle={reportTarget.previewSubtitle}
        />
      )}
    </div>
  );
}
