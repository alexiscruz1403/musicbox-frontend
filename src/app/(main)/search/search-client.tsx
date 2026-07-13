"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiCatalogSearch, apiTrendingAlbums } from "@/lib/api";
import { ratingColor, formatMs, getInitials, coverGradient } from "@/lib/review-format";
import { dedupeById } from "@/lib/array-utils";
import type {
  CatalogAlbum,
  CatalogTrack,
  CatalogArtist,
  TrendingAlbum,
} from "@/types/api";

type SearchTab = "todo" | "albums" | "songs" | "artists";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AlbumCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-xl bg-mb-input" />
      <div className="mt-2.5 h-4 w-3/4 rounded bg-mb-input" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-mb-input" />
    </div>
  );
}

function ArtistChipSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2.5 animate-pulse" style={{ width: 88 }}>
      <div className="w-[88px] h-[88px] rounded-full bg-mb-input" />
      <div className="h-3 w-14 rounded bg-mb-input" />
    </div>
  );
}


// ─── Sub-components ──────────────────────────────────────────────────────────

function AlbumCard({
  title,
  artist,
  coverUrl,
  deezerId,
  avgRating,
}: {
  title: string;
  artist: string;
  coverUrl: string | null;
  deezerId: string;
  avgRating?: number | null;
}) {
  return (
    <Link href={`/album/${deezerId}`} className="group block">
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
        <div className="absolute inset-0 bg-mb-bg/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-mb-primary text-white font-semibold text-sm rounded-lg">
            Ver álbum
          </span>
        </div>
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-base leading-tight truncate">
          {title}
        </p>
        <p className="text-mb-muted text-xs mt-0.5 truncate">{artist}</p>
        {avgRating != null ? (
          <span
            className="font-mono font-bold text-sm mt-1 block"
            style={{ color: ratingColor(avgRating) }}
          >
            {avgRating.toFixed(1)}
          </span>
        ) : (
          <span className="text-mb-dim text-xs mt-1 block">Sin reseñas</span>
        )}
      </div>
    </Link>
  );
}

function TrackCard({
  title,
  artist,
  coverUrl,
  deezerId,
  durationMs,
}: {
  title: string;
  artist: string;
  coverUrl: string | null;
  deezerId: string;
  durationMs?: number | null;
}) {
  return (
    <Link href={`/track/${deezerId}`} className="group block">
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
        <div className="absolute inset-0 bg-mb-bg/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-mb-primary text-white font-semibold text-sm rounded-lg">
            Ver canción
          </span>
        </div>
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-base leading-tight truncate">
          {title}
        </p>
        <p className="text-mb-muted text-xs mt-0.5 truncate">{artist}</p>
        {durationMs != null && (
          <span className="font-mono text-mb-dim text-xs mt-1 block">
            {formatMs(durationMs)}
          </span>
        )}
      </div>
    </Link>
  );
}

function ArtistCard({ artist }: { artist: CatalogArtist }) {
  return (
    <Link
      href={`/catalog/artists/${artist.deezerId}`}
      className="flex flex-col items-center gap-3 bg-mb-card border border-mb-border rounded-xl p-6 hover:border-mb-ddp transition-colors"
    >
      {artist.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-20 h-20 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-2xl text-mb-accent"
          style={{ background: coverGradient(artist.deezerId) }}
          aria-hidden
        >
          {getInitials(artist.name)}
        </div>
      )}
      <p className="font-semibold text-mb-text text-sm text-center">
        {artist.name}
      </p>
    </Link>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  // Initialize tab from URL param so it survives back-navigation
  const initialTab = (() => {
    const t = searchParams.get("tab");
    return (["todo", "albums", "songs", "artists"].includes(t ?? "") ? t : "todo") as SearchTab;
  })();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Track scroll position continuously — Next.js resets scroll to 0 during
  // navigation before unmount, so window.scrollY in cleanup is always 0.
  const scrollYRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ref to avoid stale closure in cleanup effects
  const scrollMetaRef = useRef({ q: debouncedQuery });
  useEffect(() => { scrollMetaRef.current.q = debouncedQuery; });

  // Only reset tab on real query changes, not on the initial mount render
  const queryChangedRef = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim();
      setDebouncedQuery(next);
      if (queryChangedRef.current) setActiveTab("todo");
      queryChangedRef.current = true;
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Sync debounced query → URL
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current === debouncedQuery) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    router.replace(`/search${debouncedQuery ? `?${params}` : ""}`, { scroll: false });
  }, [debouncedQuery, router, searchParams]);

  // Sync active tab → URL
  useEffect(() => {
    if (!debouncedQuery) return;
    const current = searchParams.get("tab") ?? "todo";
    if (current === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    activeTab === "todo" ? params.delete("tab") : params.set("tab", activeTab);
    router.replace(`/search?${params}`, { scroll: false });
  }, [activeTab, debouncedQuery, router, searchParams]);

  // Save scroll position on unmount (back-navigation will restore URL and this scroll)
  useEffect(() => {
    const meta = scrollMetaRef;
    const scrollY = scrollYRef;
    return () => {
      if (meta.current.q) {
        sessionStorage.setItem(
          "mb-search-scroll",
          JSON.stringify({ y: scrollY.current, q: meta.current.q }),
        );
      }
    };
  }, []);

  // Restore scroll position on mount (TanStack Query cache means results render immediately)
  useEffect(() => {
    if (!initialQuery) return;
    const raw = sessionStorage.getItem("mb-search-scroll");
    if (!raw) return;
    sessionStorage.removeItem("mb-search-scroll");
    try {
      const { y, q } = JSON.parse(raw) as { y: number; q: string };
      if (q !== initialQuery) return;
      requestAnimationFrame(() => setTimeout(() => window.scrollTo(0, y), 0));
    } catch { /* ignore malformed storage */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trending albums for initial state
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-albums", 6],
    queryFn: () => apiTrendingAlbums(6),
    staleTime: 4 * 60 * 60 * 1000,
    enabled: !debouncedQuery,
  });

  const trendingAlbums: TrendingAlbum[] = trendingData?.data ?? [];

  // ── Infinite search queries ───────────────────────────────────────────────

  const {
    data: albumPages,
    fetchNextPage: fetchNextAlbums,
    hasNextPage: hasMoreAlbums,
    isFetchingNextPage: fetchingMoreAlbums,
    isFetching: albumFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", debouncedQuery, "album"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(debouncedQuery, "album", 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!debouncedQuery && (activeTab === "todo" || activeTab === "albums"),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: trackPages,
    fetchNextPage: fetchNextTracks,
    hasNextPage: hasMoreTracks,
    isFetchingNextPage: fetchingMoreTracks,
    isFetching: trackFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", debouncedQuery, "track"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(debouncedQuery, "track", 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!debouncedQuery && (activeTab === "todo" || activeTab === "songs"),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: artistPages,
    fetchNextPage: fetchNextArtists,
    hasNextPage: hasMoreArtists,
    isFetchingNextPage: fetchingMoreArtists,
    isFetching: artistFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", debouncedQuery, "artist"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(debouncedQuery, "artist", 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!debouncedQuery && (activeTab === "todo" || activeTab === "artists"),
    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages into item arrays. Deduped by deezerId — paginated cursor
  // results from the external catalog can repeat an id across pages, which
  // would otherwise produce duplicate React keys and break rendering.
  const albums = dedupeById(
    (albumPages?.pages ?? []).flatMap((page) =>
      (page.data.items ?? []).filter((r) => r.type === "album").map((r) => r.item as CatalogAlbum),
    ),
  );
  const tracks = dedupeById(
    (trackPages?.pages ?? []).flatMap((page) =>
      (page.data.items ?? []).filter((r) => r.type === "track").map((r) => r.item as CatalogTrack),
    ),
  );
  const artists = dedupeById(
    (artistPages?.pages ?? []).flatMap((page) =>
      (page.data.items ?? []).filter((r) => r.type === "artist").map((r) => r.item as CatalogArtist),
    ),
  );

  // Total counts from first page of each query (API-reported, not loaded count)
  const totalAlbums = albumPages?.pages[0]?.data.total ?? 0;
  const totalTracks = trackPages?.pages[0]?.data.total ?? 0;
  const totalArtists = artistPages?.pages[0]?.data.total ?? 0;

  const isFetchingFirstPage =
    (albumFetching && !albumPages) ||
    (trackFetching && !trackPages) ||
    (artistFetching && !artistPages);
  const isFetchingMore = fetchingMoreAlbums || fetchingMoreTracks || fetchingMoreArtists;
  const hasMore =
    (activeTab === "todo" && (hasMoreAlbums || hasMoreTracks || hasMoreArtists)) ||
    (activeTab === "albums" && hasMoreAlbums) ||
    (activeTab === "songs" && hasMoreTracks) ||
    (activeTab === "artists" && hasMoreArtists);

  const hasQuery = debouncedQuery.length > 0;

  const visibleAlbums = activeTab === "todo" || activeTab === "albums" ? albums : [];
  const visibleTracks = activeTab === "todo" || activeTab === "songs" ? tracks : [];
  const visibleArtists = activeTab === "todo" || activeTab === "artists" ? artists : [];

  const showItemGrid = hasQuery && activeTab !== "artists";
  const showArtistGrid = hasQuery && activeTab === "artists";
  const showEmpty =
    hasQuery &&
    !isFetchingFirstPage &&
    visibleAlbums.length === 0 &&
    visibleTracks.length === 0 &&
    visibleArtists.length === 0;

  // Load more when sentinel enters viewport
  const loadMore = useCallback(() => {
    if ((activeTab === "todo" || activeTab === "albums") && hasMoreAlbums && !fetchingMoreAlbums)
      fetchNextAlbums();
    if ((activeTab === "todo" || activeTab === "songs") && hasMoreTracks && !fetchingMoreTracks)
      fetchNextTracks();
    if ((activeTab === "todo" || activeTab === "artists") && hasMoreArtists && !fetchingMoreArtists)
      fetchNextArtists();
  }, [
    activeTab,
    hasMoreAlbums, hasMoreTracks, hasMoreArtists,
    fetchingMoreAlbums, fetchingMoreTracks, fetchingMoreArtists,
    fetchNextAlbums, fetchNextTracks, fetchNextArtists,
  ]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const tabs: { id: SearchTab; label: string }[] = [
    { id: "todo", label: "Todo" },
    { id: "albums", label: "Álbumes" },
    { id: "songs", label: "Canciones" },
    { id: "artists", label: "Artistas" },
  ];

  // Derive artists list for initial state from trending
  const trendingArtists = Array.from(
    new Map(
      trendingAlbums.map((a) => [a.artist.name, { name: a.artist.name, id: a.deezerId }])
    ).values()
  ).slice(0, 7);

  return (
    <div className="flex justify-center px-4 md:px-[clamp(20px,3vw,48px)]">
      <div className="w-full max-w-[920px] pt-10 pb-24">

        {/* ── Search bar ── */}
        <div className="sticky top-0 z-20 bg-mb-bg pb-3.5 pt-4 mb-2">
          <div
            className={cn(
              "flex items-center gap-3 bg-mb-input border border-mb-border rounded-lg px-4 transition-all",
              "focus-within:border-mb-primary focus-within:shadow-[0_0_0_1px_var(--color-mb-primary)]",
            )}
          >
            <Search className="w-5 h-5 text-mb-muted shrink-0" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar catálogo"
              placeholder="Buscá un álbum, canción o artista…"
              className="flex-1 min-w-0 h-[54px] bg-transparent border-none outline-none text-mb-text text-[17px] placeholder:text-mb-dim"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="w-8 h-8 flex items-center justify-center bg-mb-border rounded-full text-mb-muted hover:bg-mb-ddp hover:text-mb-text transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          {hasQuery && (
            <div className="flex gap-1 mt-3.5 border-b border-mb-border overflow-x-auto no-scrollbar overflow-y-hidden">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "shrink-0 h-11 px-4 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                    activeTab === t.id
                      ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                      : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Initial state ── */}
        {!hasQuery && (
          <>
            <section className="mb-12">
              <h2 className="font-serif font-normal text-2xl text-mb-text mb-5">
                Álbumes populares esta semana
              </h2>
              {trendingLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <AlbumCardSkeleton key={i} />
                  ))}
                </div>
              ) : trendingAlbums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {trendingAlbums.map((a) => (
                    <AlbumCard
                      key={a.deezerId}
                      deezerId={a.deezerId}
                      title={a.title}
                      artist={a.artist.name}
                      coverUrl={a.coverUrl}
                      avgRating={a.avgRating}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-mb-muted text-sm">
                  Usá el buscador para explorar el catálogo.
                </p>
              )}
            </section>

            {trendingArtists.length > 0 && (
              <section>
                <h2 className="font-serif font-normal text-2xl text-mb-text mb-5">
                  Artistas más reseñados
                </h2>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                  {trendingArtists.map((ar) => (
                    <div
                      key={ar.id}
                      className="shrink-0 w-24 flex flex-col items-center gap-2.5"
                    >
                      <div
                        className="w-[88px] h-[88px] rounded-full flex items-center justify-center font-serif text-2xl text-mb-accent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                        style={{ background: coverGradient(ar.id) }}
                        aria-hidden
                      >
                        {getInitials(ar.name)}
                      </div>
                      <span className="text-xs text-mb-text text-center leading-tight">
                        {ar.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Results ── */}
        {hasQuery && !showEmpty && (
          <>
            {/* Counter */}
            {!isFetchingFirstPage && (
              <p className="text-mb-dim text-sm mt-4 mb-5">
                {activeTab === "artists"
                  ? `${totalArtists} artista${totalArtists !== 1 ? "s" : ""} encontrado${totalArtists !== 1 ? "s" : ""} para "${debouncedQuery}"`
                  : activeTab === "songs"
                    ? `${totalTracks} canción${totalTracks !== 1 ? "es" : ""} encontrada${totalTracks !== 1 ? "s" : ""} para "${debouncedQuery}"`
                    : activeTab === "albums"
                      ? `${totalAlbums} álbum${totalAlbums !== 1 ? "es" : ""} encontrado${totalAlbums !== 1 ? "s" : ""} para "${debouncedQuery}"`
                      : `${totalAlbums + totalTracks} resultado${totalAlbums + totalTracks !== 1 ? "s" : ""} para "${debouncedQuery}"`}
              </p>
            )}

            {/* Albums + Tracks grid */}
            {showItemGrid && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isFetchingFirstPage
                  ? Array.from({ length: 8 }).map((_, i) => <AlbumCardSkeleton key={i} />)
                  : [
                      ...visibleAlbums.filter((a) => !!a.deezerId).map((a) => (
                        <AlbumCard
                          key={`album-${a.deezerId}`}
                          deezerId={a.deezerId}
                          title={a.title}
                          artist={a.artist.name}
                          coverUrl={a.coverUrl}
                        />
                      )),
                      ...visibleTracks.filter((t) => !!t.deezerId).map((t) => (
                        <TrackCard
                          key={`track-${t.deezerId}`}
                          deezerId={t.deezerId}
                          title={t.title}
                          artist={t.artist.name}
                          coverUrl={t.coverUrl}
                          durationMs={t.durationMs}
                        />
                      )),
                    ]}
              </div>
            )}

            {/* Artist grid */}
            {showArtistGrid && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isFetchingFirstPage
                  ? Array.from({ length: 6 }).map((_, i) => <AlbumCardSkeleton key={i} />)
                  : visibleArtists.map((ar) => (
                      <ArtistCard key={ar.deezerId} artist={ar} />
                    ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
              {isFetchingMore && (
                <div
                  className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                  aria-label="Cargando más resultados"
                />
              )}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-mb-card border border-mb-border flex items-center justify-center mb-5">
              <Search className="w-7 h-7 text-mb-dim" />
            </div>
            <h2 className="font-serif font-normal text-[22px] text-mb-text mb-2.5">
              No encontramos resultados para &ldquo;{debouncedQuery}&rdquo;
            </h2>
            <p className="text-mb-muted text-sm leading-relaxed max-w-sm">
              Probá con otro nombre o revisá la ortografía.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
