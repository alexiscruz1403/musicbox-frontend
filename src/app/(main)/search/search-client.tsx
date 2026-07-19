"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  apiCatalogSearch,
  apiTrendingAlbums,
  apiCatalogRecentlyViewed,
  apiCatalogSearchHistory,
} from "@/lib/api";
import { ratingColor, formatMs, getInitials, coverGradient } from "@/lib/review-format";
import { dedupeById } from "@/lib/array-utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOutsideClose } from "@/hooks/use-outside-close";
import { CatalogSearchDropdown } from "@/components/search/catalog-search-dropdown";
import type {
  CatalogAlbum,
  CatalogTrack,
  CatalogArtist,
  TrendingAlbum,
  CatalogSearchHistoryItem,
  RecentlyViewedItem,
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
  reviewCount,
  userRating,
}: {
  title: string;
  artist: string;
  coverUrl: string | null;
  deezerId: string;
  avgRating?: number | null;
  reviewCount?: number;
  userRating?: number | null;
}) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  return (
    <Link href={`/album/${deezerId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={tCommon("coverAlt", { title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title })}
          />
        )}
        <div className="absolute inset-0 bg-mb-bg/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-mb-primary text-white font-semibold text-sm rounded-lg">
            {t("viewAlbum")}
          </span>
        </div>
        {userRating != null && (
          <span
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-mb-bg/80 border border-mb-ddp font-mono font-bold text-[11px]"
            style={{ color: ratingColor(userRating) }}
          >
            {userRating.toFixed(2)}
          </span>
        )}
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
            {avgRating.toFixed(2)}
          </span>
        ) : reviewCount != null ? (
          <span className="text-mb-dim text-xs mt-1 block">
            {reviewCount > 0
              ? t("reviewCount", { count: reviewCount })
              : t("noReviewsYet")}
          </span>
        ) : (
          <span className="text-mb-dim text-xs mt-1 block">{t("noReviews")}</span>
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
  reviewCount,
  userRating,
}: {
  title: string;
  artist: string;
  coverUrl: string | null;
  deezerId: string;
  durationMs?: number | null;
  reviewCount?: number;
  userRating?: number | null;
}) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  return (
    <Link href={`/track/${deezerId}`} className="group block">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={tCommon("coverAlt", { title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: coverGradient(deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title })}
          />
        )}
        <div className="absolute inset-0 bg-mb-bg/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-mb-primary text-white font-semibold text-sm rounded-lg">
            {t("viewTrack")}
          </span>
        </div>
        {userRating != null && (
          <span
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-mb-bg/80 border border-mb-ddp font-mono font-bold text-[11px]"
            style={{ color: ratingColor(userRating) }}
          >
            {userRating.toFixed(2)}
          </span>
        )}
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
        {reviewCount != null && (
          <span className="text-mb-dim text-xs mt-1 block">
            {reviewCount > 0
              ? t("reviewCount", { count: reviewCount })
              : t("noReviewsYet")}
          </span>
        )}
      </div>
    </Link>
  );
}

function ArtistCard({ artist }: { artist: CatalogArtist }) {
  const t = useTranslations("Search");
  return (
    <Link
      href={`/artist/${artist.deezerId}`}
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
      {artist.reviewCount != null && (
        <p className="text-mb-dim text-xs -mt-1">
          {t("reviewCount", { count: artist.reviewCount })}
        </p>
      )}
    </Link>
  );
}

function RecentlyViewedCard({ item }: { item: RecentlyViewedItem }) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const type = item.resourceType.toUpperCase();
  const isAlbum = type === "ALBUM";
  const isTrack = type === "TRACK";
  const isArtist = !isAlbum && !isTrack;

  const href = isAlbum
    ? `/album/${item.deezerId}`
    : isTrack
      ? `/track/${item.deezerId}`
      : `/artist/${item.deezerId}`;

  const subtitle = isArtist
    ? item.albumsCount != null
      ? t("albumsCount", { count: item.albumsCount })
      : t("typeLabels.artist")
    : item.artistName;

  const typeLabel = isAlbum ? t("typeLabels.album") : isTrack ? t("typeLabels.track") : null;

  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative overflow-hidden",
          isArtist ? "rounded-full aspect-square" : "rounded-xl aspect-square",
        )}
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt={tCommon("coverAlt", { title: item.title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif text-xl text-mb-accent"
            style={{ background: coverGradient(item.deezerId) }}
            role="img"
            aria-label={tCommon("coverAlt", { title: item.title })}
          >
            {isArtist ? getInitials(item.title) : ""}
          </div>
        )}
        {typeLabel && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-mb-bg/70 text-[9px] font-semibold uppercase tracking-wide text-mb-accent">
            {typeLabel}
          </span>
        )}
      </div>
      <div className="mt-2.5">
        <p className="font-serif text-mb-text text-base leading-tight truncate">
          {item.title}
        </p>
        <p className="text-mb-muted text-xs mt-0.5 truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface SearchClientProps {
  accessToken?: string;
}

export function SearchClient({ accessToken }: SearchClientProps) {
  const t = useTranslations("Search");
  const tCommon = useTranslations("Common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  // Initialize tab from URL param so it survives back-navigation
  const initialTab = (() => {
    const tabParam = searchParams.get("tab");
    return (["todo", "albums", "songs", "artists"].includes(tabParam ?? "") ? tabParam : "todo") as SearchTab;
  })();

  const [query, setQuery] = useState(initialQuery);
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchBarWrapRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useOutsideClose(searchBarWrapRef, dropdownOpen, () => setDropdownOpen(false));

  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  // Track scroll position continuously — Next.js resets scroll to 0 during
  // navigation before unmount, so window.scrollY in cleanup is always 0.
  const scrollYRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ref to avoid stale closure in cleanup effects
  const scrollMetaRef = useRef({ q: committedQuery });
  useEffect(() => { scrollMetaRef.current.q = committedQuery; });

  // Only reset tab on real query changes, not on the initial mount render
  const queryChangedRef = useRef(false);
  useEffect(() => {
    if (queryChangedRef.current) setActiveTab("todo");
    queryChangedRef.current = true;
  }, [committedQuery]);

  // Record catalog search history server-side (backend auto-writes it when a
  // valid JWT is attached to /catalog/search) — refresh the dropdown's cache
  // whenever a logged-in commit happens so the recent-searches panel is fresh.
  useEffect(() => {
    if (!accessToken || !committedQuery) return;
    queryClient.invalidateQueries({ queryKey: ["catalog-search-history"] });
  }, [accessToken, committedQuery, queryClient]);

  // Sync committed query → URL
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current === committedQuery) return;
    const params = new URLSearchParams();
    if (committedQuery) params.set("q", committedQuery);
    router.replace(`/search${committedQuery ? `?${params}` : ""}`, { scroll: false });
  }, [committedQuery, router, searchParams]);

  // Sync active tab → URL
  useEffect(() => {
    if (!committedQuery) return;
    const current = searchParams.get("tab") ?? "todo";
    if (current === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    activeTab === "todo" ? params.delete("tab") : params.set("tab", activeTab);
    router.replace(`/search?${params}`, { scroll: false });
  }, [activeTab, committedQuery, router, searchParams]);

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
    enabled: !committedQuery,
  });

  const trendingAlbums: TrendingAlbum[] = trendingData?.data ?? [];

  // Recently viewed (catalog) — logged-in users only, initial state only.
  // staleTime 0 + refetchOnMount "always" so every navigation back into
  // /search (e.g. from an album/track/artist detail page) fetches fresh data
  // instead of serving a cached list that's missing the resource just visited.
  const { data: recentlyViewedData } = useQuery({
    queryKey: ["catalog-recently-viewed"],
    queryFn: () => apiCatalogRecentlyViewed(accessToken as string),
    enabled: !!accessToken && !committedQuery,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const recentlyViewed: RecentlyViewedItem[] = recentlyViewedData?.data ?? [];

  // Catalog search history — fetched as soon as the page mounts (not gated on
  // dropdown focus) so it's instantly ready the first time the dropdown opens.
  const { data: searchHistoryData, isLoading: searchHistoryLoading } = useQuery({
    queryKey: ["catalog-search-history"],
    queryFn: () => apiCatalogSearchHistory(accessToken as string),
    enabled: !!accessToken,
    staleTime: 30 * 1000,
  });
  const searchHistory: CatalogSearchHistoryItem[] = searchHistoryData?.data ?? [];

  // ── Infinite search queries ───────────────────────────────────────────────

  const {
    data: albumPages,
    fetchNextPage: fetchNextAlbums,
    hasNextPage: hasMoreAlbums,
    isFetchingNextPage: fetchingMoreAlbums,
    isFetching: albumFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", committedQuery, "album"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(committedQuery, "album", 20, pageParam as string | undefined, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!committedQuery && (activeTab === "todo" || activeTab === "albums"),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: trackPages,
    fetchNextPage: fetchNextTracks,
    hasNextPage: hasMoreTracks,
    isFetchingNextPage: fetchingMoreTracks,
    isFetching: trackFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", committedQuery, "track"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(committedQuery, "track", 20, pageParam as string | undefined, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!committedQuery && (activeTab === "todo" || activeTab === "songs"),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: artistPages,
    fetchNextPage: fetchNextArtists,
    hasNextPage: hasMoreArtists,
    isFetchingNextPage: fetchingMoreArtists,
    isFetching: artistFetching,
  } = useInfiniteQuery({
    queryKey: ["catalog-search", committedQuery, "artist"],
    queryFn: ({ pageParam }) =>
      apiCatalogSearch(committedQuery, "artist", 20, pageParam as string | undefined, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: !!committedQuery && (activeTab === "todo" || activeTab === "artists"),
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

  const hasQuery = committedQuery.length > 0;

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
    { id: "todo", label: t("tabAll") },
    { id: "albums", label: t("tabAlbums") },
    { id: "songs", label: t("tabSongs") },
    { id: "artists", label: t("tabArtists") },
  ];

  function handleSelectRecent(item: CatalogSearchHistoryItem) {
    setQuery(item.query);
    setCommittedQuery(item.query);
    setActiveTab(
      item.type === "artist" ? "artists" : item.type === "album" ? "albums" : "songs",
    );
    setDropdownOpen(false);
  }

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
          <div ref={searchBarWrapRef} className="relative">
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
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCommittedQuery(query.trim());
                    setDropdownOpen(false);
                  }
                }}
                aria-label={t("searchAriaLabel")}
                placeholder={t("searchPlaceholder")}
                className="flex-1 min-w-0 h-[54px] bg-transparent border-none outline-none text-mb-text text-[17px] placeholder:text-mb-dim"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCommittedQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label={tCommon("clearSearch")}
                  className="w-8 h-8 flex items-center justify-center bg-mb-border rounded-full text-mb-muted hover:bg-mb-ddp hover:text-mb-text transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {dropdownOpen && (
              <CatalogSearchDropdown
                query={query}
                debouncedQuery={debouncedQuery}
                accessToken={accessToken}
                history={searchHistory}
                isHistoryLoading={searchHistoryLoading}
                onSelectRecent={handleSelectRecent}
                onClose={() => setDropdownOpen(false)}
              />
            )}
          </div>

          {/* Tabs */}
          {hasQuery && (
            <div className="flex gap-1 mt-3.5 border-b border-mb-border overflow-x-auto no-scrollbar overflow-y-hidden">
              {tabs.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id)}
                  className={cn(
                    "shrink-0 h-11 px-4 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                    activeTab === tb.id
                      ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                      : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
                  )}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Initial state ── */}
        {!hasQuery && (
          <>
            {recentlyViewed.length > 0 && (
              <section className="mb-12">
                <h2 className="font-serif font-normal text-2xl text-mb-text mb-5">
                  {t("recentlyViewedHeading")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {recentlyViewed.map((item) => (
                    <RecentlyViewedCard
                      key={`${item.resourceType}-${item.deezerId}`}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="mb-12">
              <h2 className="font-serif font-normal text-2xl text-mb-text mb-5">
                {t("trendingAlbumsHeading")}
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
                  {t("useSearchHint")}
                </p>
              )}
            </section>

            {trendingArtists.length > 0 && (
              <section>
                <h2 className="font-serif font-normal text-2xl text-mb-text mb-5">
                  {t("trendingArtistsHeading")}
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
                  ? t("resultsCountArtists", { count: totalArtists, query: committedQuery })
                  : activeTab === "songs"
                    ? t("resultsCountSongs", { count: totalTracks, query: committedQuery })
                    : activeTab === "albums"
                      ? t("resultsCountAlbums", { count: totalAlbums, query: committedQuery })
                      : t("resultsCountAll", { count: totalAlbums + totalTracks, query: committedQuery })}
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
                          reviewCount={a.reviewCount}
                          userRating={a.userRating}
                        />
                      )),
                      ...visibleTracks.filter((tr) => !!tr.deezerId).map((tr) => (
                        <TrackCard
                          key={`track-${tr.deezerId}`}
                          deezerId={tr.deezerId}
                          title={tr.title}
                          artist={tr.artist.name}
                          coverUrl={tr.coverUrl}
                          durationMs={tr.durationMs}
                          reviewCount={tr.reviewCount}
                          userRating={tr.userRating}
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
                  aria-label={t("loadingMoreAriaLabel")}
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
              {t("noResultsHeading", { query: committedQuery })}
            </h2>
            <p className="text-mb-muted text-sm leading-relaxed max-w-sm">
              {t("noResultsBody")}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
