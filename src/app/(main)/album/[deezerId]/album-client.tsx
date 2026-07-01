"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiAlbumReviews } from "@/lib/api";
import type { CatalogAlbum, CatalogReview } from "@/types/api";

type ReviewSort = "recent" | "rating";

function ratingColor(r: number): string {
  if (r >= 8) return "#A78BFA";
  if (r >= 5) return "#7C6CAD";
  return "#4A4265";
}

function formatMs(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function releaseYear(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 4);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function coverGradient(seed: string): string {
  const h = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [258, 280, 240, 300, 220];
  const hue = hues[h % hues.length];
  return `linear-gradient(135deg, hsl(${hue},60%,20%) 0%, hsl(${hue + 20},40%,12%) 100%)`;
}

// ─── Animated wave bars ──────────────────────────────────────────────────────

function WaveBars({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden className="inline-flex items-center gap-0.5 h-4">
      {[0, 0.15, 0.3].map((delay) => (
        <span
          key={delay}
          className="w-[2.5px] rounded-sm"
          style={{
            height: "100%",
            background: "currentColor",
            animation: playing
              ? `mbWave 0.8s ease-in-out ${delay}s infinite`
              : "none",
            transform: playing ? undefined : "scaleY(0.4)",
          }}
        />
      ))}
      <style>{`
        @keyframes mbWave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
      `}</style>
    </span>
  );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: CatalogReview }) {
  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(
    review.userReaction,
  );

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span
          aria-hidden
          className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
        >
          {getInitials(review.user.displayName)}
        </span>
        <div className="min-w-0 flex-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-mb-text">
            {review.user.displayName}
          </span>
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

      <p className="text-[15px] leading-relaxed text-mb-text mb-3.5 line-clamp-4">
        {review.description}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setReaction((r) => (r === "LIKE" ? null : "LIKE"))}
          aria-label="Me gusta"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "LIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M7 10l4-7a2.5 2.5 0 0 1 3 2.5L13.5 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>
          {review.likesCount + (reaction === "LIKE" ? 1 : 0)}
        </button>
        <button
          type="button"
          onClick={() => setReaction((r) => (r === "DISLIKE" ? null : "DISLIKE"))}
          aria-label="No me gusta"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-mb-input"
          style={{ color: reaction === "DISLIKE" ? "#8B56E8" : "#9B95B0" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3"/><path d="M17 14l-4 7a2.5 2.5 0 0 1-3-2.5L10.5 15H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17"/></svg>
          {review.dislikesCount + (reaction === "DISLIKE" ? 1 : 0)}
        </button>
        <button
          type="button"
          aria-label="Comentarios"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8 8 0 0 1-11.7 7L3 21l2.5-6.3A8 8 0 1 1 21 11.5Z"/></svg>
          {review.commentsCount}
        </button>
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AlbumClientProps {
  album: CatalogAlbum;
}

export function AlbumClient({ album }: AlbumClientProps) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(
    (trackId: string, previewUrl: string | null) => {
      if (!previewUrl) return;

      if (playingId === trackId) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(previewUrl);
      audio.addEventListener("ended", () => setPlayingId(null));
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlayingId(trackId);
    },
    [playingId],
  );

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["album-reviews", album.deezerId, reviewSort],
    queryFn: () => apiAlbumReviews(album.deezerId, reviewSort),
    staleTime: 60 * 1000,
  });

  const reviews: CatalogReview[] = reviewsData?.data?.items ?? [];

  const reviewTabs: { id: ReviewSort; label: string }[] = [
    { id: "recent", label: "Recientes" },
    { id: "rating", label: "Mejor puntuadas" },
  ];

  return (
    <div className="relative min-h-screen bg-mb-bg text-mb-text font-sans">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* ── Hero ── */}
      <section
        className="relative border-b border-mb-border"
        style={{
          background:
            "linear-gradient(180deg,rgba(61,26,122,0.5) 0%,rgba(38,18,80,0.32) 45%,rgba(10,10,15,0.96) 100%),#0A0A0F",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pt-[72px] pb-12 flex flex-col md:flex-row gap-5 md:gap-10 items-center md:items-end text-center md:text-left">
          {/* Cover */}
          <div
            className="shrink-0 w-40 h-40 md:w-60 md:h-60 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
            style={
              album.coverUrl
                ? { backgroundImage: `url(${album.coverUrl})`, backgroundSize: "cover" }
                : { background: coverGradient(album.deezerId) }
            }
            role="img"
            aria-label={`Cover de ${album.title}`}
          />

          {/* Info */}
          <div className="min-w-0 flex-1 pb-2">
            <span className="inline-block px-2.5 py-1 border border-mb-ddp rounded-full text-[11px] tracking-widest uppercase text-mb-accent font-semibold mb-3.5">
              Álbum
            </span>
            <h1 className="font-serif font-normal text-[32px] md:text-5xl leading-[1.05] text-mb-text mb-2.5">
              {album.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mb-5 justify-center md:justify-start">
              <Link
                href={`/catalog/artists/${album.artist.deezerId}`}
                className="text-[18px] font-semibold text-mb-text hover:text-mb-accent"
              >
                {album.artist.name}
              </Link>
              {releaseYear(album.releaseDate) && (
                <>
                  <span className="text-mb-dim">·</span>
                  <span className="text-sm text-mb-dim">
                    {releaseYear(album.releaseDate)}
                  </span>
                </>
              )}
            </div>
            <div
              aria-hidden
              className="h-px w-[200px] mx-auto md:mx-0 mb-5"
              style={{
                background: "linear-gradient(90deg,#6B35D4,transparent)",
              }}
            />
            <div className="flex items-end gap-6 flex-wrap justify-center md:justify-start">
              <div role="group" aria-label="0 reseñas">
                <p className="text-mb-muted text-sm mt-1.5">
                  0 reseñas
                </p>
              </div>
              <button
                type="button"
                className="h-12 px-7 bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] rounded-lg transition-all hover:shadow-[0_0_20px_rgba(107,53,212,0.35)]"
              >
                Escribir reseña
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] py-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-[clamp(32px,5vw,64px)] items-start">

        {/* Tracklist */}
        <section>
          <h2 className="font-serif font-normal text-2xl text-mb-text mb-4">
            Canciones
          </h2>
          <div className="flex flex-col">
            {album.tracks.map((track, index) => {
              const isPlaying = playingId === track.deezerId;
              return (
                <div
                  key={track.deezerId}
                  className={cn(
                    "flex items-center gap-3.5 min-h-[52px] px-2.5 py-2 rounded-lg transition-colors",
                    isPlaying ? "bg-[#16161F]" : "hover:bg-[#16161F]",
                  )}
                >
                  <span className="w-5 text-center font-mono text-xs text-mb-dim shrink-0">
                    {track.trackNumber ?? index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/track/${track.deezerId}`}
                      className="text-[15px] text-mb-text truncate block hover:text-mb-accent transition-colors"
                    >
                      {track.title}
                    </Link>
                  </div>
                  {track.durationMs != null && (
                    <span className="shrink-0 font-mono text-sm text-mb-muted min-w-[38px] text-right">
                      {formatMs(track.durationMs)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePlay(track.deezerId, track.previewUrl)}
                    aria-label={
                      isPlaying
                        ? `Pausar preview de ${track.title}`
                        : `Reproducir preview de ${track.title}`
                    }
                    disabled={!track.previewUrl}
                    className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-mb-dp disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: isPlaying ? "#8B56E8" : "#9B95B0" }}
                  >
                    {isPlaying ? (
                      <WaveBars playing={isPlaying} />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="font-serif font-normal text-2xl text-mb-text mb-4">
            Qué dice la comunidad
          </h2>

          {/* Sort tabs */}
          <div className="flex gap-1 border-b border-mb-border mb-5 overflow-x-auto no-scrollbar overflow-y-hidden">
            {reviewTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setReviewSort(t.id)}
                className={cn(
                  "shrink-0 h-11 px-3.5 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                  reviewSort === t.id
                    ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                    : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Review list */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-mb-card border border-mb-border rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full bg-mb-input" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 rounded bg-mb-input" />
                      <div className="h-3 w-1/4 rounded bg-mb-input" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-mb-input" />
                    <div className="h-3 w-4/5 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-mb-muted text-sm">
                Todavía no hay reseñas de este álbum.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
