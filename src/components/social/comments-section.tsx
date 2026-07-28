"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  apiGetComments,
  apiCreateComment,
  apiDeleteComment,
  generateIdempotencyKey,
  ApiError,
} from "@/lib/api";
import { getInitials, timeAgo } from "@/lib/review-format";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";
import type { Comment, SocialTarget } from "@/types/api";

// Extraído tal cual de review-detail-client.tsx cuando el detalle de tierlist
// necesitó la misma superficie: el backend expone GET/POST de comentarios como
// un espejo exacto entre `/reviews/:id` y `/tierlists/:id` (mismas
// validaciones, sanitización, throttle y paginación), y PATCH/DELETE
// /comments/:id ya eran agnósticas del target. Ver docs/tierlist-features.md.

export interface CommentReportTarget {
  commentId: string;
  content: string;
  handle: string;
}

interface CommentsSectionProps {
  target: SocialTarget;
  targetId: string;
  commentsCount: number;
  onCommentsCountChange: (delta: number) => void;
  currentUserId?: string;
  currentUserDisplayName?: string;
  accessToken?: string;
  onReport?: (target: CommentReportTarget) => void;
}

export function CommentsSection({
  target,
  targetId,
  commentsCount,
  onCommentsCountChange,
  currentUserId,
  currentUserDisplayName,
  accessToken,
  onReport,
}: CommentsSectionProps) {
  const t = useTranslations("Social.comments");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["comments", target, targetId],
    queryFn: ({ pageParam }) =>
      apiGetComments(targetId, pageParam as string | undefined, 10, target),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });

  const comments: Comment[] = (pages?.pages ?? []).flatMap((p) => p.data.items);

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  function addComment() {
    const text = draft.trim();
    if (!text || !accessToken) return;
    setError(null);
    onCommentsCountChange(1);
    startTransition(async () => {
      try {
        await apiCreateComment(accessToken, targetId, text, generateIdempotencyKey(), target);
        setDraft("");
        await refetch();
      } catch (err) {
        onCommentsCountChange(-1);
        const apiErr = err as ApiError;
        setError(apiErr.message || t("postError"));
      }
    });
  }

  function handleDelete(commentId: string) {
    if (!accessToken) return;
    if (!window.confirm(t("confirmDelete"))) return;
    onCommentsCountChange(-1);
    setDeletingId(commentId);
    startTransition(async () => {
      try {
        await apiDeleteComment(accessToken, commentId);
        await refetch();
      } catch {
        onCommentsCountChange(1);
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <section>
      <h2 className="font-serif font-normal text-[22px] text-mb-text mb-5">
        {t("heading", { count: commentsCount })}
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
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("placeholder")}
              className="w-full min-h-11 p-2.5 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-y text-sm leading-relaxed"
            />
            {error && (
              <p role="alert" className="text-mb-error text-xs mt-1.5">
                {error}
              </p>
            )}
            <div className="flex justify-end mt-2.5">
              <button
                type="button"
                onClick={addComment}
                disabled={draft.trim().length === 0 || pending}
                className={cn(
                  "min-h-10 px-4.5 rounded-lg font-semibold text-sm transition-colors",
                  draft.trim().length === 0 || pending
                    ? "bg-mb-border text-mb-dim cursor-not-allowed"
                    : "bg-mb-primary hover:bg-mb-primary-h text-white cursor-pointer",
                )}
              >
                {t("submit")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-mb-muted text-sm mb-7">
          <Link href="/login" className="text-mb-accent hover:underline">
            {t("loginLinkLabel")}
          </Link>{" "}
          {t("loginSuffix")}
        </p>
      )}

      {isFetching && comments.length === 0 ? (
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
        <p className="text-mb-muted text-sm">{t("empty")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.user.avatarUrl}
                    alt={t("avatarAlt", { name: c.user.displayName })}
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
                      onClick={() => handleDelete(c.id)}
                      disabled={pending && deletingId === c.id}
                      aria-label={t("deleteAriaLabel")}
                      className="min-h-8 py-1 mt-1 bg-transparent border-none text-mb-dim text-xs font-medium cursor-pointer hover:text-mb-error transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {pending && deletingId === c.id ? t("deletingLabel") : t("deleteAction")}
                    </button>
                  ) : (
                    currentUserId &&
                    onReport && (
                      <button
                        type="button"
                        onClick={() =>
                          onReport({
                            commentId: c.id,
                            content: c.content,
                            handle: c.user.handle,
                          })
                        }
                        aria-label={t("reportAriaLabel")}
                        className="min-h-8 py-1 mt-1 bg-transparent border-none text-mb-dim text-xs font-medium cursor-pointer hover:text-mb-error transition-colors"
                      >
                        {t("reportAction")}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
            {isFetchingNextPage && (
              <div
                className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                aria-label={t("loadingMoreAriaLabel")}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}
