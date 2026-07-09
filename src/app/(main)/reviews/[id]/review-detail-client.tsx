"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Pencil, Trash2, Flag, ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiDeleteReview,
  apiGetComments,
  apiCreateComment,
  apiDeleteComment,
  generateIdempotencyKey,
  ApiError,
} from "@/lib/api";
import { sendReaction } from "@/lib/reactions";
import { ratingColor, timeAgo, getInitials, coverGradient } from "@/lib/review-format";
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
  const isOwner = !!currentUserId && currentUserId === review.userId;

  const [reaction, setReaction] = useState<ReactionType | null>(review.userReaction);
  const [likes, setLikes] = useState(review.likesCount);
  const [dislikes, setDislikes] = useState(review.dislikesCount);
  const [commentsCount, setCommentsCount] = useState(review.commentsCount);
  const [draftComment, setDraftComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startReactionTransition] = useTransition();
  const [commentPending, startCommentTransition] = useTransition();
  const commentsSentinelRef = useRef<HTMLDivElement>(null);

  const rating = Number(review.rating);

  const {
    data: commentPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: commentsFetching,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ["review-comments", review.id],
    queryFn: ({ pageParam }) => apiGetComments(review.id, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });

  const comments = (commentPages?.pages ?? []).flatMap((p) => p.data.items);

  useEffect(() => {
    const el = commentsSentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  function addComment() {
    const text = draftComment.trim();
    if (!text || !accessToken) return;
    setCommentError(null);
    setCommentsCount((c) => c + 1);
    startCommentTransition(async () => {
      try {
        await apiCreateComment(accessToken, review.id, text, generateIdempotencyKey());
        setDraftComment("");
        await refetchComments();
      } catch (err) {
        setCommentsCount((c) => c - 1);
        const apiErr = err as ApiError;
        setCommentError(apiErr.message || "No se pudo publicar el comentario.");
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    if (!accessToken) return;
    if (!window.confirm("¿Eliminar este comentario?")) return;
    setCommentsCount((c) => c - 1);
    setDeletingCommentId(commentId);
    startCommentTransition(async () => {
      try {
        await apiDeleteComment(accessToken, commentId);
        await refetchComments();
      } catch {
        setCommentsCount((c) => c + 1);
      } finally {
        setDeletingCommentId(null);
      }
    });
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

          {!isOwner && accessToken && (
            <button
              type="button"
              onClick={() =>
                setReportTarget({
                  targetType: "REVIEW",
                  targetId: review.id,
                  previewTitle: review.externalTitle
                    ? `Reseña de ${review.externalTitle}`
                    : "Esta reseña",
                  previewSubtitle: review.user.handle
                    ? `de @${review.user.handle}`
                    : undefined,
                })
              }
              aria-label="Reportar reseña"
              className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-error transition-colors"
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
            onClick={() => handleReact("LIKE")}
            aria-label="Me gusta"
            aria-pressed={reaction === "LIKE"}
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors"
            style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
          >
            <ThumbsUp width={18} height={18} strokeWidth={1.75} fill={reaction === "LIKE" ? "currentColor" : "none"} />
            {likes}
          </button>
          <button
            type="button"
            onClick={() => handleReact("DISLIKE")}
            aria-label="No me gusta"
            aria-pressed={reaction === "DISLIKE"}
            className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg text-sm font-medium hover:bg-mb-input transition-colors"
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
        <section>
          <h2 className="font-serif font-normal text-[22px] text-mb-text mb-5">
            {commentsCount} comentarios
          </h2>

          {accessToken ? (
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
                {commentError && (
                  <p role="alert" className="text-mb-error text-xs mt-1.5">
                    {commentError}
                  </p>
                )}
                <div className="flex justify-end mt-2.5">
                  <button
                    type="button"
                    onClick={addComment}
                    disabled={draftComment.trim().length === 0 || commentPending}
                    className={cn(
                      "min-h-10 px-4.5 rounded-lg font-semibold text-sm transition-colors",
                      draftComment.trim().length === 0 || commentPending
                        ? "bg-mb-border text-mb-dim cursor-not-allowed"
                        : "bg-mb-primary hover:bg-mb-primary-h text-white cursor-pointer",
                    )}
                  >
                    Comentar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-mb-muted text-sm mb-7">
              <Link href="/login" className="text-mb-accent hover:underline">
                Iniciá sesión
              </Link>{" "}
              para comentar.
            </p>
          )}

          {commentsFetching && comments.length === 0 ? (
            <div className="flex flex-col gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-mb-input" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 rounded bg-mb-input" />
                    <div className="h-3 w-4/5 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-mb-muted text-sm">Todavía no hay comentarios. Sé el primero.</p>
          ) : (
            <>
              <div className="flex flex-col gap-5">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    {c.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.user.avatarUrl}
                        alt={`Avatar de ${c.user.displayName}`}
                        className="shrink-0 w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="shrink-0 w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent"
                      >
                        {getInitials(c.user.displayName)}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-medium text-mb-text">{c.user.displayName}</span>
                        {c.user.handle && (
                          <Link
                            href={`/u/${c.user.handle}`}
                            className="font-mono text-xs text-mb-muted hover:text-mb-accent"
                          >
                            @{c.user.handle}
                          </Link>
                        )}
                        <span className="text-xs text-mb-dim">· {timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-mb-text">{c.content}</p>
                      {currentUserId === c.userId ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={commentPending && deletingCommentId === c.id}
                          aria-label="Eliminar comentario"
                          className="min-h-8 py-1 mt-1 bg-transparent border-none text-mb-dim text-xs font-medium cursor-pointer hover:text-mb-error transition-colors disabled:opacity-60"
                        >
                          {commentPending && deletingCommentId === c.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      ) : (
                        currentUserId && (
                          <button
                            type="button"
                            onClick={() =>
                              setReportTarget({
                                targetType: "COMMENT",
                                targetId: c.id,
                                previewTitle: c.content.slice(0, 140),
                                previewSubtitle: c.user.handle
                                  ? `de @${c.user.handle}`
                                  : undefined,
                              })
                            }
                            aria-label="Reportar comentario"
                            className="min-h-8 py-1 mt-1 bg-transparent border-none text-mb-dim text-xs font-medium cursor-pointer hover:text-mb-error transition-colors"
                          >
                            Reportar
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div ref={commentsSentinelRef} className="h-8 flex items-center justify-center mt-4">
                {isFetchingNextPage && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                    aria-label="Cargando más comentarios"
                  />
                )}
              </div>
            </>
          )}
        </section>
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
