"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Disc3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiTrackReviews, apiCatalogAlbum } from "@/lib/api";
import type { CatalogTrack, CatalogReview } from "@/types/api";

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

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
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

const WAVE_HEIGHTS = [40, 65, 50, 80, 95, 70, 55, 90, 100, 60, 45, 75, 85, 55, 70, 95, 80, 50, 65, 90, 75, 60, 85, 100, 70, 45, 55, 80, 65, 90, 50, 70];

// ─── Review card ──────────────────────────────────────────────────────────────

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

      <p className="text-[15px] leading-relaxed text-mb-text mb-3.5">
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

// ─── Audio Preview Player ─────────────────────────────────────────────────────

interface AudioPreviewProps {
  previewUrl: string;
}

function AudioPreviewPlayer({ previewUrl }: AudioPreviewProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(previewUrl);
      audio.addEventListener("timeupdate", () =>
        setCurrentTime(Math.floor(audio.currentTime)),
      );
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current = audio;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, previewUrl]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const duration = 30;
  const progress = duration > 0 ? currentTime / duration : 0;
  const playedIndex = Math.floor(progress * WAVE_HEIGHTS.length);

  return (
    <>
      {/* Desktop: inline player */}
      <div className="hidden md:flex items-center gap-4 bg-mb-card border border-mb-border rounded-xl px-4 py-3.5 mb-6 max-w-[460px]">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar preview" : "Reproducir preview de 30 segundos"}
          className="w-12 h-12 flex items-center justify-center bg-mb-primary hover:bg-mb-primary-h rounded-full text-white transition-colors shrink-0"
        >
          {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Waveform */}
          <div
            aria-hidden
            className="flex items-center gap-[2.5px] h-[30px]"
          >
            {WAVE_HEIGHTS.map((h, i) => {
              const isPlayed = playing && i < playedIndex;
              return (
                <span
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: !playing
                      ? "#252332"
                      : isPlayed
                        ? "#8B56E8"
                        : "#3D1A7A",
                    animation: playing
                      ? `mbWave ${0.7 + (i % 4) * 0.12}s ease-in-out ${(i % 8) * 0.05}s infinite`
                      : "none",
                    transformOrigin: "center",
                    transform: playing ? undefined : "scaleY(0.35)",
                    transition: "background 0.15s ease",
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px] text-mb-muted">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes mbWave {
            0%, 100% { transform: scaleY(0.35); }
            50%       { transform: scaleY(1); }
          }
        `}</style>
      </div>

      {/* Mobile: compact button */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar preview" : "Escuchar preview · 30s"}
        className="md:hidden w-full h-12 flex items-center justify-center gap-2.5 bg-transparent border border-mb-primary rounded-lg text-mb-accent font-semibold text-[15px] hover:bg-mb-dp transition-colors mt-5"
      >
        {playing ? (
          <>
            <Pause className="w-4 h-4" /> Pausar preview
          </>
        ) : (
          <>
            <Play className="w-4 h-4" /> Escuchar preview · 30s
          </>
        )}
      </button>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TrackClientProps {
  track: CatalogTrack;
}

export function TrackClient({ track }: TrackClientProps) {
  const router = useRouter();
  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");

  const { data: albumData } = useQuery({
    queryKey: ["album", track.albumDeezerId],
    queryFn: () => apiCatalogAlbum(track.albumDeezerId!),
    enabled: !!track.albumDeezerId,
    staleTime: 10 * 60 * 1000,
  });

  const albumTitle = albumData?.data?.title ?? null;

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["track-reviews", track.deezerId, reviewSort],
    queryFn: () => apiTrackReviews(track.deezerId, reviewSort),
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
        <div className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pt-16 pb-12 flex flex-col md:flex-row gap-5 md:gap-10 items-center text-center md:text-left">
          {/* Cover + album chip */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.coverUrl}
                alt={`Cover de ${track.title}`}
                className="w-40 h-40 md:w-60 md:h-60 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] object-cover"
              />
            ) : (
              <div
                className="w-40 h-40 md:w-60 md:h-60 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
                style={{ background: coverGradient(track.deezerId) }}
                role="img"
                aria-label={`Cover de ${track.title}`}
              />
            )}
            {track.albumDeezerId && (
              <Link
                href={`/album/${track.albumDeezerId}`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-mb-card border border-mb-border rounded-full text-mb-muted text-xs hover:border-mb-ddp hover:text-mb-accent transition-colors"
              >
                <Disc3 className="w-3 h-3" />
                <span className="whitespace-nowrap">
                  del álbum{" "}
                  <span className="text-mb-text font-medium">
                    {albumTitle ?? "…"}
                  </span>
                </span>
              </Link>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 pb-2">
            <span className="inline-block px-2.5 py-1 border border-mb-ddp rounded-full text-[11px] tracking-widest uppercase text-mb-accent font-semibold mb-3.5">
              Canción
            </span>
            <h1 className="font-serif font-normal text-[32px] md:text-5xl leading-[1.05] text-mb-text mb-2.5">
              {track.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mb-5 justify-center md:justify-start">
              <Link
                href={`/catalog/artists/${track.artist.deezerId}`}
                className="text-[18px] font-semibold text-mb-text hover:text-mb-accent"
              >
                {track.artist.name}
              </Link>
              <span className="text-mb-dim">·</span>
              <span className="text-sm text-mb-dim">
                {releaseYear(track.releaseDate) || "—"}
              </span>
              {track.durationMs != null && (
                <>
                  <span className="text-mb-dim">·</span>
                  <span className="font-mono text-sm text-mb-muted">
                    {formatMs(track.durationMs)}
                  </span>
                </>
              )}
            </div>
            <div
              aria-hidden
              className="h-px w-[200px] mx-auto md:mx-0 mb-5"
              style={{ background: "linear-gradient(90deg,#6B35D4,transparent)" }}
            />

            {/* Audio preview */}
            {track.previewUrl && <AudioPreviewPlayer previewUrl={track.previewUrl} />}

            {/* Rating + CTA */}
            <div className="flex items-end gap-6 flex-wrap justify-center md:justify-start">
              <div role="group" aria-label="0 reseñas">
                <p className="text-mb-muted text-sm mt-1.5">0 reseñas</p>
              </div>
              <button
                type="button"
                className="hidden md:block h-12 px-7 bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] rounded-lg transition-all hover:shadow-[0_0_20px_rgba(107,53,212,0.35)]"
              >
                Escribir reseña
              </button>
            </div>

            {/* Mobile CTA */}
            <button
              type="button"
              className="md:hidden w-full h-12 border-none bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] rounded-lg mt-3 transition-colors"
            >
              Escribir reseña
            </button>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <div className="max-w-[760px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] py-12 pb-24">
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
                Todavía no hay reseñas de esta canción.
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
