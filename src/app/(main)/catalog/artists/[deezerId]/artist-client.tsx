"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  apiCatalogArtistDetail,
  apiCatalogArtistAlbums,
  apiCatalogArtistTracks,
} from "@/lib/api";
import { ratingColor, getInitials, coverGradient, formatMs } from "@/lib/review-format";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";
import { dedupeById } from "@/lib/array-utils";
import type {
  CatalogArtist,
  CatalogAlbum,
  ArtistTopAlbum,
  ArtistTopTrack,
  ArtistTrackItem,
} from "@/types/api";

type TopMode = "albums" | "tracks";
type CatalogTab = "albums" | "tracks";

// ─── Presentational pieces ────────────────────────────────────────────────────

function ArtistTopItemCard({
  title,
  href,
  coverUrl,
  deezerId,
  avgRating,
  reviewCount,
}: {
  title: string;
  href: string;
  coverUrl: string | null;
  deezerId: string;
  avgRating: number | null;
  reviewCount: number;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Cover de ${title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(deezerId) }}
            role="img"
            aria-label={`Cover de ${title}`}
          />
        )}
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-[15px] leading-tight truncate">
          {title}
        </p>
        <span className="flex items-center gap-1.5 mt-1">
          {avgRating != null ? (
            <>
              <span
                className="font-mono font-bold text-xs"
                style={{ color: ratingColor(avgRating) }}
              >
                {avgRating.toFixed(1)}
              </span>
              <span className="text-mb-dim text-[11px]">
                · {reviewCount} reseña{reviewCount !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="text-mb-dim text-xs">Sin reseñas</span>
          )}
        </span>
      </div>
    </Link>
  );
}

function CatalogAlbumTile({ album }: { album: CatalogAlbum }) {
  return (
    <Link href={`/album/${album.deezerId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverUrl}
            alt={`Cover de ${album.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(album.deezerId) }}
            role="img"
            aria-label={`Cover de ${album.title}`}
          />
        )}
      </div>
      <p className="mt-2.5 font-serif text-mb-text text-sm leading-tight truncate">
        {album.title}
      </p>
    </Link>
  );
}

function CatalogTrackRow({ track }: { track: ArtistTrackItem }) {
  return (
    <Link
      href={`/track/${track.deezerId}`}
      className="flex items-center gap-3.5 min-h-[56px] px-2.5 py-2 rounded-lg border-b border-mb-border transition-colors hover:bg-[#16161F]"
    >
      <span
        className="shrink-0 w-11 h-11 rounded-md"
        style={
          track.coverUrl
            ? { backgroundImage: `url(${track.coverUrl})`, backgroundSize: "cover" }
            : { background: coverGradient(track.deezerId) }
        }
        role="img"
        aria-label={`Cover de ${track.title}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-mb-text truncate">{track.title}</span>
        {track.albumTitle && (
          <span className="block text-xs text-mb-muted truncate">{track.albumTitle}</span>
        )}
      </span>
      {track.durationMs != null && (
        <span className="shrink-0 font-mono text-xs text-mb-dim w-10 text-right">
          {formatMs(track.durationMs)}
        </span>
      )}
    </Link>
  );
}

function TopGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-xl bg-mb-input" />
          <div className="mt-2.5 h-4 w-3/4 rounded bg-mb-input" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-mb-input" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ArtistClientProps {
  artist: CatalogArtist;
  albumsTotal: number;
  tracksTotal: number;
}

export function ArtistClient({ artist, albumsTotal, tracksTotal }: ArtistClientProps) {
  const router = useRouter();
  const [topMode, setTopMode] = useState<TopMode>("albums");
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("albums");

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["artist-detail", artist.deezerId],
    queryFn: () => apiCatalogArtistDetail(artist.deezerId),
    staleTime: 5 * 60 * 1000,
  });

  const detail = detailData?.data;
  const topReviewed: (ArtistTopAlbum | ArtistTopTrack)[] =
    (topMode === "albums" ? detail?.topReviewedAlbums : detail?.topReviewedTracks) ?? [];
  const topTrending: (ArtistTopAlbum | ArtistTopTrack)[] =
    (topMode === "albums" ? detail?.trendingAlbums : detail?.trendingTracks) ?? [];

  const {
    data: albumPages,
    fetchNextPage: fetchNextAlbums,
    hasNextPage: hasMoreAlbums,
    isFetchingNextPage: fetchingMoreAlbums,
  } = useInfiniteQuery({
    queryKey: ["artist-albums", artist.deezerId],
    queryFn: ({ pageParam }) =>
      apiCatalogArtistAlbums(artist.deezerId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: trackPages,
    fetchNextPage: fetchNextTracks,
    hasNextPage: hasMoreTracks,
    isFetchingNextPage: fetchingMoreTracks,
  } = useInfiniteQuery({
    queryKey: ["artist-tracks", artist.deezerId],
    queryFn: ({ pageParam }) =>
      apiCatalogArtistTracks(artist.deezerId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 10 * 60 * 1000,
  });

  const albums = dedupeById((albumPages?.pages ?? []).flatMap((p) => p.data.items));
  const tracks = dedupeById((trackPages?.pages ?? []).flatMap((p) => p.data.items));

  const albumsSentinelRef = useInfiniteScrollSentinel({
    hasNextPage: hasMoreAlbums,
    isFetchingNextPage: fetchingMoreAlbums,
    fetchNextPage: fetchNextAlbums,
    enabled: catalogTab === "albums",
  });
  const tracksSentinelRef = useInfiniteScrollSentinel({
    hasNextPage: hasMoreTracks,
    isFetchingNextPage: fetchingMoreTracks,
    fetchNextPage: fetchNextTracks,
    enabled: catalogTab === "tracks",
  });

  const topToggle: { id: TopMode; label: string }[] = [
    { id: "albums", label: "Álbumes" },
    { id: "tracks", label: "Canciones" },
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
        <div className="max-w-[1100px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pt-[72px] pb-10 flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-end text-center md:text-left">
          {artist.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            />
          ) : (
            <div
              className="shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center font-serif text-4xl text-mb-accent shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
              style={{ background: coverGradient(artist.deezerId) }}
              aria-hidden
            >
              {getInitials(artist.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 pb-1.5">
            <span className="inline-block px-2.5 py-1 border border-mb-ddp rounded-full text-[11px] tracking-widest uppercase text-mb-accent font-semibold mb-3.5">
              Artista
            </span>
            <h1 className="font-serif font-normal text-[32px] md:text-5xl leading-[1.05] text-mb-text mb-2.5">
              {artist.name}
            </h1>
            <p className="text-sm text-mb-muted">
              {albumsTotal} álbum{albumsTotal !== 1 ? "es" : ""} · {tracksTotal} canci
              {tracksTotal !== 1 ? "ones" : "ón"}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] py-11 pb-24">
        {/* ── Top 5 más reseñados ── */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4.5 flex-wrap gap-3">
            <h2 className="font-serif font-normal text-[22px] text-mb-text">
              Top 5 más reseñados
            </h2>
            <div className="flex gap-1">
              {topToggle.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopMode(t.id)}
                  className={cn(
                    "min-h-9 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                    topMode === t.id
                      ? "bg-mb-ddp/40 border-mb-primary text-mb-accent"
                      : "bg-transparent border-mb-border text-mb-muted hover:text-mb-text",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {detailLoading ? (
            <TopGridSkeleton />
          ) : topReviewed.length === 0 ? (
            <p className="text-mb-muted text-sm py-6">
              Todavía no hay reseñas para este artista.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {topReviewed.map((item) => (
                <ArtistTopItemCard
                  key={item.deezerId}
                  title={item.title}
                  href={topMode === "albums" ? `/album/${item.deezerId}` : `/track/${item.deezerId}`}
                  coverUrl={item.coverUrl}
                  deezerId={item.deezerId}
                  avgRating={item.avgRating}
                  reviewCount={item.reviewCount}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Top 5 trending ── */}
        <section className="mb-14">
          <h2 className="font-serif font-normal text-[22px] text-mb-text mb-4.5">
            Top 5 trending
          </h2>
          {detailLoading ? (
            <TopGridSkeleton />
          ) : topTrending.length === 0 ? (
            <p className="text-mb-muted text-sm py-6">
              Todavía no hay tendencias para este artista.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {topTrending.map((item) => (
                <ArtistTopItemCard
                  key={item.deezerId}
                  title={item.title}
                  href={topMode === "albums" ? `/album/${item.deezerId}` : `/track/${item.deezerId}`}
                  coverUrl={item.coverUrl}
                  deezerId={item.deezerId}
                  avgRating={item.avgRating}
                  reviewCount={item.reviewCount}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Catálogo ── */}
        <section>
          <div className="flex border-b border-mb-border mb-5">
            <button
              type="button"
              onClick={() => setCatalogTab("albums")}
              className={cn(
                "flex-1 min-w-0 min-h-11 px-2 bg-transparent border-none text-sm sm:text-[15px] cursor-pointer truncate transition-colors -mb-px",
                catalogTab === "albums"
                  ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                  : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
              )}
            >
              Álbumes <span className="font-mono text-[11px] text-mb-dim">({albumsTotal})</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab("tracks")}
              className={cn(
                "flex-1 min-w-0 min-h-11 px-2 bg-transparent border-none text-sm sm:text-[15px] cursor-pointer truncate transition-colors -mb-px",
                catalogTab === "tracks"
                  ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                  : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
              )}
            >
              Canciones <span className="font-mono text-[11px] text-mb-dim">({tracksTotal})</span>
            </button>
          </div>

          {catalogTab === "albums" ? (
            <>
              {albums.length === 0 && !fetchingMoreAlbums ? (
                <p className="text-mb-muted text-sm py-6">
                  Este artista todavía no tiene álbumes en el catálogo.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                  {albums.map((a) => (
                    <CatalogAlbumTile key={a.deezerId} album={a} />
                  ))}
                </div>
              )}
              <div ref={albumsSentinelRef} className="h-8 flex items-center justify-center mt-6">
                {fetchingMoreAlbums ? (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                    aria-label="Cargando más álbumes"
                  />
                ) : (
                  !hasMoreAlbums &&
                  albums.length > 0 && (
                    <p className="text-mb-dim text-sm">Ya viste todo el catálogo.</p>
                  )
                )}
              </div>
            </>
          ) : (
            <>
              {tracks.length === 0 && !fetchingMoreTracks ? (
                <p className="text-mb-muted text-sm py-6">
                  Este artista todavía no tiene canciones en el catálogo.
                </p>
              ) : (
                <div className="flex flex-col">
                  {tracks.map((t) => (
                    <CatalogTrackRow key={t.deezerId} track={t} />
                  ))}
                </div>
              )}
              <div ref={tracksSentinelRef} className="h-8 flex items-center justify-center mt-6">
                {fetchingMoreTracks ? (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                    aria-label="Cargando más canciones"
                  />
                ) : (
                  !hasMoreTracks &&
                  tracks.length > 0 && (
                    <p className="text-mb-dim text-sm">Ya viste todo el catálogo.</p>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
