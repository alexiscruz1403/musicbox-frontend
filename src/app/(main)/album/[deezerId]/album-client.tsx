"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiAlbumReviews } from "@/lib/api";
import { formatMs, coverGradient } from "@/lib/review-format";
import { CommunityReviewList } from "@/components/reviews/community-review-list";
import type { CatalogAlbum } from "@/types/api";

type ReviewSort = "recent" | "rating";

function releaseYear(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 4);
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

// ─── Main component ───────────────────────────────────────────────────────────

interface AlbumClientProps {
  album: CatalogAlbum;
  hasSession: boolean;
}

export function AlbumClient({ album, hasSession }: AlbumClientProps) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: reviewsFetching,
  } = useInfiniteQuery({
    queryKey: ["album-reviews", album.deezerId, reviewSort],
    queryFn: ({ pageParam }) => apiAlbumReviews(album.deezerId, reviewSort, pageParam as string | undefined),
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

  return (
    <div className="relative min-h-screen bg-mb-bg text-mb-text font-sans">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
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
                href={`/artist/${album.artist.deezerId}`}
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
            <div className="flex items-end gap-6 flex-wrap justify-center md:justify-start">
              <div role="group" aria-label="0 reseñas">
                <p className="text-mb-muted text-sm mt-1.5">
                  0 reseñas
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    hasSession
                      ? `/album/${album.deezerId}/review/new`
                      : `/login?callbackUrl=${encodeURIComponent(`/album/${album.deezerId}/review/new`)}`,
                  )
                }
                className="h-12 px-7 bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] rounded-lg transition-all hover:shadow-[0_0_20px_rgba(107,53,212,0.35)] cursor-pointer"
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
                    className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-mb-dp cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
          <CommunityReviewList
            reviews={reviews}
            isLoading={reviewsFetching && reviews.length === 0}
            isFetchingNextPage={isFetchingNextPage}
            sentinelRef={sentinelRef}
            emptyMessage="Todavía no hay reseñas de este álbum."
            hasSession={hasSession}
          />
        </section>
      </div>

    </div>
  );
}
