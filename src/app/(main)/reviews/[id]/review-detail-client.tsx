"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiDeleteReview, ApiError } from "@/lib/api";
import { ratingColor, timeAgo, getInitials, coverGradient } from "@/lib/review-format";
import type { ReviewDetail } from "@/types/api";

interface ReviewDetailClientProps {
  review: ReviewDetail;
  currentUserId?: string;
  currentUserHandle?: string;
  currentUserDisplayName?: string;
  accessToken?: string;
}

interface LocalComment {
  id: string;
  text: string;
}

export function ReviewDetailClient({
  review,
  currentUserId,
  currentUserHandle,
  currentUserDisplayName,
  accessToken,
}: ReviewDetailClientProps) {
  const router = useRouter();
  const isOwner = !!currentUserId && currentUserId === review.userId;

  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [draftComment, setDraftComment] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rating = Number(review.rating);
  const liked = reaction === "LIKE";
  const disliked = reaction === "DISLIKE";
  const likeCount = review.reactionStats.likes + (liked ? 1 : 0);
  const dislikeCount = review.reactionStats.dislikes + (disliked ? 1 : 0);

  const targetKind = review.type === "ALBUM" ? "album" : "track";
  const targetHref = review.targetDeezerId ? `/${targetKind}/${review.targetDeezerId}` : null;
  const editHref = review.targetDeezerId
    ? `/${targetKind}/${review.targetDeezerId}/review/new?edit=${review.id}`
    : null;

  function addComment() {
    const text = draftComment.trim();
    if (!text) return;
    setComments((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setDraftComment("");
  }

  function handleDelete() {
    if (!accessToken) return;
    if (!window.confirm("¿Eliminar esta reseña? Esta acción no se puede deshacer.")) {
      return;
    }
    setDeleteError(null);
    const afterDelete = currentUserHandle ? `/u/${currentUserHandle}` : "/";
    startTransition(async () => {
      try {
        await apiDeleteReview(accessToken, review.id);
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
            ? "No tenés permiso para eliminar esta reseña."
            : apiErr.message || "No se pudo eliminar la reseña.",
        );
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors"
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
                aria-label="Más opciones"
                className="w-11 h-11 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors"
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
                      Editar
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex items-center gap-2.5 w-full min-h-10 px-3 py-2 rounded-md text-mb-error text-sm text-left hover:bg-mb-border transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isPending ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              )}
            </div>
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
              aria-label={`Cover de ${review.externalTitle ?? ""}`}
            />
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 border border-mb-ddp rounded-full text-[10px] tracking-wider uppercase text-mb-accent font-semibold mb-1.5">
                {review.type === "ALBUM" ? "Álbum" : "Canción"}
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
              {rating.toFixed(1)}
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
                {review.type === "ALBUM" ? "Álbum" : "Canción"}
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
            {rating.toFixed(1)}
          </span>
          <span className="font-mono text-lg text-mb-dim">/10</span>
        </div>

        <div className="text-[15px] leading-[1.75] text-mb-text mb-10 whitespace-pre-wrap">
          {review.description}
        </div>

        {/* Per-track ratings */}
        {review.type === "ALBUM" && review.trackReviewItems && review.trackReviewItems.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif font-normal text-[22px] text-mb-text mb-4.5">
              Calificaciones por canción
            </h2>
            <div className="flex flex-col gap-4">
              {review.trackReviewItems.map((item, i) => (
                <div key={item.deezerId ?? item.trackNumber ?? i}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="min-w-0 flex-1 text-sm text-mb-text truncate">
                      {item.title ?? `Canción ${item.trackNumber ?? i + 1}`}
                    </span>
                    <span
                      className="shrink-0 font-mono font-bold text-sm"
                      style={{ color: ratingColor(item.rating) }}
                    >
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`Puntuación ${item.rating.toFixed(1)} de 10`}
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
            onClick={() => setReaction((r) => (r === "LIKE" ? null : "LIKE"))}
            aria-label="Me gusta"
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors"
            style={{ color: liked ? "#8B56E8" : "#9B95B0" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M7 10l4-7a2.5 2.5 0 0 1 3 2.5L13.5 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>
            {likeCount}
          </button>
          <button
            type="button"
            onClick={() => setReaction((r) => (r === "DISLIKE" ? null : "DISLIKE"))}
            aria-label="No me gusta"
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors"
            style={{ color: disliked ? "#8B56E8" : "#9B95B0" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={disliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3"/><path d="M17 14l-4 7a2.5 2.5 0 0 1-3-2.5L10.5 15H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17"/></svg>
            {dislikeCount}
          </button>
          <span className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium text-mb-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8 8 0 0 1-11.7 7L3 21l2.5-6.3A8 8 0 1 1 21 11.5Z"/></svg>
            {comments.length}
          </span>
        </div>

        {/* Comments — local-only, no persistence */}
        <section>
          <h2 className="font-serif font-normal text-[22px] text-mb-text mb-5">
            {comments.length} comentarios
          </h2>

          <div className="flex gap-3 mb-7">
            <span
              aria-hidden
              className="shrink-0 w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent"
            >
              {getInitials(currentUserDisplayName)}
            </span>
            <div className="flex-1 min-w-0">
              <textarea
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                placeholder="Sumá tu comentario…"
                className="w-full min-h-11 p-2.5 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-y text-sm leading-relaxed"
              />
              <div className="flex justify-end mt-2.5">
                <button
                  type="button"
                  onClick={addComment}
                  disabled={draftComment.trim().length === 0}
                  className={cn(
                    "min-h-10 px-4.5 rounded-lg font-semibold text-sm transition-colors",
                    draftComment.trim().length === 0
                      ? "bg-mb-border text-mb-dim cursor-not-allowed"
                      : "bg-mb-primary hover:bg-mb-primary-h text-white cursor-pointer",
                  )}
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <span
                  aria-hidden
                  className="shrink-0 w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent"
                >
                  {getInitials(currentUserDisplayName)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed text-mb-text">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
