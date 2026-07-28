"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  List,
  MessageCircle,
  MoreVertical,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { apiDeleteTierlist, generateIdempotencyKey, ApiError } from "@/lib/api";
import { sendReaction } from "@/lib/reactions";
import { coverGradient, getInitials, timeAgo } from "@/lib/review-format";
import { TierBoard } from "@/components/tierlists/tier-board";
import { CommentsSection } from "@/components/social/comments-section";
import { ReportModal } from "@/components/reports/report-modal";
import { Modal } from "@/components/ui/modal";
import type { ReactionType, Tierlist } from "@/types/api";

interface CommentReport {
  targetId: string;
  previewTitle: string;
  previewSubtitle?: string;
}

interface TierlistDetailClientProps {
  tierlist: Tierlist;
  currentUserId?: string;
  currentUserHandle?: string;
  currentUserDisplayName?: string;
  accessToken?: string;
}

export function TierlistDetailClient({
  tierlist,
  currentUserId,
  currentUserHandle,
  currentUserDisplayName,
  accessToken,
}: TierlistDetailClientProps) {
  const router = useRouter();
  const t = useTranslations("Tierlist.detail");
  const tCard = useTranslations("Tierlist.card");
  const tBadge = useTranslations("Tierlist");
  const tComments = useTranslations("Social.comments");
  const tCommon = useTranslations("Common");
  const isOwner = !!currentUserId && currentUserId === tierlist.userId;

  const [reaction, setReaction] = useState<ReactionType | null>(tierlist.userReaction);
  const [likes, setLikes] = useState(tierlist.likesCount);
  const [dislikes, setDislikes] = useState(tierlist.dislikesCount);
  const [commentsCount, setCommentsCount] = useState(tierlist.commentsCount);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [commentReport, setCommentReport] = useState<CommentReport | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startReactionTransition] = useTransition();

  const author = tierlist.user;
  const editHref = `/artist/${tierlist.artist.deezerId}/tierlist?edit=${tierlist.id}`;

  function handleReact(clicked: ReactionType) {
    if (!accessToken) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/tierlists/${tierlist.id}`)}`);
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
        await sendReaction(accessToken, tierlist.id, prevReaction, clicked, "tierlists");
      } catch {
        setReaction(prevReaction);
        setLikes(prevLikes);
        setDislikes(prevDislikes);
      }
    });
  }

  function handleDelete() {
    if (!accessToken) return;
    setDeleteError(null);
    const afterDelete = currentUserHandle ? `/u/${currentUserHandle}` : "/feed";
    startTransition(async () => {
      try {
        await apiDeleteTierlist(accessToken, tierlist.id, generateIdempotencyKey());
        router.push(afterDelete);
        router.refresh();
      } catch (err) {
        const apiErr = err as ApiError;
        // El borrado es idempotente: si ya no existe, el objetivo se cumplió.
        if (apiErr.code === "TIERLIST_NOT_FOUND") {
          router.push(afterDelete);
          router.refresh();
          return;
        }
        setConfirmOpen(false);
        setDeleteError(
          apiErr.code === "NOT_TIERLIST_OWNER"
            ? t("deleteNotOwnerError")
            : apiErr.message || t("deleteError"),
        );
      }
    });
  }

  return (
    <div
      className="min-h-screen bg-mb-bg text-mb-text font-sans"
      onClick={() => setOpenAlbumId(null)}
    >
      <div className="max-w-[780px] mx-auto px-6 md:px-[clamp(20px,5vw,40px)] pt-6 pb-24">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 min-h-11 text-sm font-medium text-mb-muted hover:text-mb-text transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" aria-hidden />
          {tCommon("back")}
        </button>

        {/* Header */}
        <header className="flex gap-4.5 items-center bg-mb-card border border-mb-border rounded-2xl p-5 mb-5.5">
          {tierlist.externalArtistImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tierlist.externalArtistImageUrl}
              alt={tCard("artistImageAlt", { name: tierlist.externalArtistName })}
              className="shrink-0 w-16 h-16 md:w-21 md:h-21 rounded-2xl object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="shrink-0 w-16 h-16 md:w-21 md:h-21 rounded-2xl shadow-[inset_2px_2px_8px_rgba(0,0,0,0.5)]"
              style={{ background: coverGradient(tierlist.artist.deezerId) }}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <List className="w-3.5 h-3.5 text-mb-accent" aria-hidden />
              <span className="text-[11px] tracking-wider uppercase text-mb-accent font-semibold">
                {tBadge("typeBadge")}
              </span>
            </div>
            <h1 className="font-serif font-normal text-2xl md:text-[30px] leading-[1.05] text-mb-text mb-2">
              <Link
                href={`/artist/${tierlist.artist.deezerId}`}
                className="hover:text-mb-accent transition-colors"
              >
                {tierlist.externalArtistName}
              </Link>
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {author?.handle && (
                <Link
                  href={`/u/${author.handle}`}
                  aria-hidden
                  tabIndex={-1}
                  className="shrink-0 w-6.5 h-6.5 rounded-full bg-mb-dp flex items-center justify-center text-[10px] font-semibold text-mb-accent"
                >
                  {getInitials(author.displayName)}
                </Link>
              )}
              <span className="text-[13px] text-mb-muted">
                {t("createdBy")}{" "}
                {author?.handle ? (
                  <Link
                    href={`/u/${author.handle}`}
                    className="font-medium text-mb-accent hover:underline"
                  >
                    @{author.handle}
                  </Link>
                ) : (
                  "—"
                )}{" "}
                · {timeAgo(tierlist.createdAt)}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="relative shrink-0 self-start">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-label={t("moreOptionsAriaLabel")}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
              >
                <MoreVertical className="w-[18px] h-[18px]" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 z-20 bg-mb-input border border-mb-border rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-1.5 min-w-[180px]">
                  <Link
                    href={editHref}
                    className="flex items-center gap-2.5 w-full min-h-10 px-3 py-2 rounded-md text-mb-text text-sm hover:bg-mb-border transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    {t("editAction")}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="flex items-center gap-2.5 w-full min-h-10 px-3 py-2 rounded-md text-mb-error text-sm text-left hover:bg-mb-border transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("deleteAction")}
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {deleteError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {deleteError}
          </div>
        )}

        {/* Tablero */}
        <div className="mb-5.5">
          <TierBoard
            tiers={tierlist.tiers}
            artistName={tierlist.externalArtistName}
            openId={openAlbumId}
            onSelect={setOpenAlbumId}
          />
        </div>

        {/* Reacciones */}
        <div className="flex items-center gap-2 mb-6.5">
          <button
            type="button"
            onClick={() => handleReact("LIKE")}
            aria-label={t("likeAriaLabel")}
            aria-pressed={reaction === "LIKE"}
            className="inline-flex items-center gap-2 min-h-11 px-4 bg-mb-card border border-mb-border rounded-xl text-sm font-semibold hover:border-mb-ddp transition-colors cursor-pointer"
            style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
          >
            <ThumbsUp
              width={18}
              height={18}
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
            className="inline-flex items-center gap-2 min-h-11 px-4 bg-mb-card border border-mb-border rounded-xl text-sm font-semibold hover:border-mb-ddp transition-colors cursor-pointer"
            style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
          >
            <ThumbsDown
              width={18}
              height={18}
              strokeWidth={1.7}
              fill={reaction === "DISLIKE" ? "currentColor" : "none"}
            />
            {dislikes}
          </button>
          <span className="inline-flex items-center gap-2 min-h-11 px-4 bg-mb-card border border-mb-border rounded-xl text-sm font-semibold text-mb-muted">
            <MessageCircle width={18} height={18} strokeWidth={1.7} />
            {commentsCount}
          </span>
        </div>

        <CommentsSection
          target="tierlists"
          targetId={tierlist.id}
          commentsCount={commentsCount}
          onCommentsCountChange={(delta) => setCommentsCount((c) => c + delta)}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          accessToken={accessToken}
          onReport={(target) =>
            setCommentReport({
              targetId: target.commentId,
              previewTitle: target.content.slice(0, 140),
              previewSubtitle: target.handle
                ? tComments("byHandle", { handle: target.handle })
                : undefined,
            })
          }
        />
      </div>

      {confirmOpen && (
        <Modal
          open
          onClose={() => setConfirmOpen(false)}
          role="alertdialog"
          ariaLabel={t("confirmDeleteAriaLabel")}
          panelClassName="w-full sm:max-w-[420px] bg-mb-card border border-mb-border rounded-t-2xl sm:rounded-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          <h2 className="font-serif text-xl text-mb-text mb-2">{t("confirmDeleteHeading")}</h2>
          <p className="text-sm leading-relaxed text-mb-muted mb-6">
            {t("confirmDeleteBody", { name: tierlist.externalArtistName })}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
              className="min-h-11 px-4 bg-mb-input border border-mb-border rounded-lg text-sm font-medium text-mb-text hover:border-mb-primary/50 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {t("cancelAction")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="min-h-11 px-4 bg-mb-error/15 border border-mb-error rounded-lg text-sm font-semibold text-mb-error hover:bg-mb-error/25 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? t("deletingLabel") : t("deleteAction")}
            </button>
          </div>
        </Modal>
      )}

      {commentReport && accessToken && (
        <ReportModal
          open
          onClose={() => setCommentReport(null)}
          accessToken={accessToken}
          targetType="COMMENT"
          targetId={commentReport.targetId}
          previewTitle={commentReport.previewTitle}
          previewSubtitle={commentReport.previewSubtitle}
        />
      )}
    </div>
  );
}
