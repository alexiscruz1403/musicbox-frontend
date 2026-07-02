"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Disc3 } from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiTrackReviews, apiCatalogAlbum } from "@/lib/api";
import { formatMs, coverGradient } from "@/lib/review-format";
import { CommunityReviewList } from "@/components/reviews/community-review-list";
import { useMeasuredWidth } from "@/hooks/use-measured-width";
import type { CatalogTrack } from "@/types/api";

type ReviewSort = "recent" | "rating";

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function releaseYear(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 4);
}

const WAVE_HEIGHTS = [40, 65, 50, 80, 95, 70, 55, 90, 100, 60, 45, 75, 85, 55, 70, 95, 80, 50, 65, 90, 75, 60, 85, 100, 70, 45, 55, 80, 65, 90, 50, 70];

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
  hasSession: boolean;
}

export function TrackClient({ track, hasSession }: TrackClientProps) {
  const router = useRouter();
  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [titleRef, titleWidth] = useMeasuredWidth<HTMLHeadingElement>([track.title]);

  const { data: albumData } = useQuery({
    queryKey: ["album", track.albumDeezerId],
    queryFn: () => apiCatalogAlbum(track.albumDeezerId!),
    enabled: !!track.albumDeezerId,
    staleTime: 10 * 60 * 1000,
  });

  const albumTitle = albumData?.data?.title ?? null;

  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: reviewsFetching,
  } = useInfiniteQuery({
    queryKey: ["track-reviews", track.deezerId, reviewSort],
    queryFn: ({ pageParam }) => apiTrackReviews(track.deezerId, reviewSort, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  });

  const reviews = (reviewPages?.pages ?? []).flatMap((p) => p.data.items);

  useEffect(() => {
    const el = sentinelRef.current;
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

  const reviewTabs: { id: ReviewSort; label: string }[] = [
    { id: "recent", label: "Recientes" },
    { id: "rating", label: "Mejor puntuadas" },
  ];

  const newReviewHref = hasSession
    ? `/track/${track.deezerId}/review/new`
    : `/login?callbackUrl=${encodeURIComponent(`/track/${track.deezerId}/review/new`)}`;

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
            <h1
              ref={titleRef}
              className="font-serif font-normal text-[32px] md:text-5xl leading-[1.05] text-mb-text mb-2.5"
            >
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
            {titleWidth !== null && (
              <div
                aria-hidden
                className="h-px mx-auto md:mx-0 mb-5"
                style={{ width: titleWidth, background: "linear-gradient(90deg,#6B35D4,transparent)" }}
              />
            )}

            {/* Audio preview */}
            {track.previewUrl && <AudioPreviewPlayer previewUrl={track.previewUrl} />}

            {/* Rating + CTA */}
            <div className="flex items-end gap-6 flex-wrap justify-center md:justify-start">
              <div role="group" aria-label="0 reseñas">
                <p className="text-mb-muted text-sm mt-1.5">0 reseñas</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(newReviewHref)}
                className="hidden md:block h-12 px-7 bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] rounded-lg transition-all hover:shadow-[0_0_20px_rgba(107,53,212,0.35)]"
              >
                Escribir reseña
              </button>
            </div>

            {/* Mobile CTA */}
            <button
              type="button"
              onClick={() => router.push(newReviewHref)}
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
          <CommunityReviewList
            reviews={reviews}
            isLoading={reviewsFetching && reviews.length === 0}
            isFetchingNextPage={isFetchingNextPage}
            sentinelRef={sentinelRef}
            emptyMessage="Todavía no hay reseñas de esta canción."
            clampDescription={false}
          />
        </section>
      </div>

    </div>
  );
}
