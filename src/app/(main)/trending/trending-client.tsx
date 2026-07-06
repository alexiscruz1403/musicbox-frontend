"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiTrendingAlbums, apiTrendingTracks } from "@/lib/api";
import { ratingColor, coverGradient } from "@/lib/review-format";
import type { TrendingAlbum, TrendingTrack } from "@/types/api";

type TrendingTab = "albums" | "tracks";

const TABS: { id: TrendingTab; label: string }[] = [
  { id: "albums", label: "Álbumes" },
  { id: "tracks", label: "Canciones" },
];

interface TrendingItem {
  deezerId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  href: string;
}

function toItem(row: TrendingAlbum | TrendingTrack, tab: TrendingTab): TrendingItem {
  return {
    deezerId: row.deezerId,
    title: row.title,
    artistName: row.artist.name,
    coverUrl: row.coverUrl,
    avgRating: row.avgRating,
    reviewCount: row.reviewCount,
    href: tab === "albums" ? `/album/${row.deezerId}` : `/track/${row.deezerId}`,
  };
}

function TopRow({ item, rank }: { item: TrendingItem; rank: number }) {
  const rating = item.avgRating;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-4 px-2.5 py-3 rounded-xl transition-colors hover:bg-[#16161F]"
    >
      <span
        className="shrink-0 text-center font-serif leading-[0.9] text-mb-ddp"
        style={{ width: 56, fontSize: rank <= 1 ? 56 : rank <= 3 ? 40 : 32 }}
      >
        #{rank}
      </span>
      <span
        className="shrink-0 w-16 h-16 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        style={
          item.coverUrl
            ? { backgroundImage: `url(${item.coverUrl})`, backgroundSize: "cover" }
            : { background: coverGradient(item.deezerId) }
        }
        role="img"
        aria-label={`Cover de ${item.title}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-lg text-mb-text leading-tight truncate">
          {item.title}
        </span>
        <span className="block text-[13px] text-mb-muted truncate mt-0.5 mb-1">
          {item.artistName}
        </span>
        <span className="flex items-center gap-2">
          {rating != null && (
            <span
              className="font-mono font-bold text-[13px]"
              style={{ color: ratingColor(rating) }}
            >
              {rating.toFixed(1)}
            </span>
          )}
          {rating != null && <span className="text-mb-border">·</span>}
          <span className="text-xs text-mb-dim">
            {item.reviewCount} reseñas esta semana
          </span>
        </span>
      </span>
    </Link>
  );
}

function RestRow({ item, rank }: { item: TrendingItem; rank: number }) {
  const rating = item.avgRating;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3.5 min-h-[48px] px-2.5 py-1.5 rounded-lg border-b border-[#16161F] transition-colors hover:bg-[#16161F]"
    >
      <span className="shrink-0 w-6 text-right font-mono text-[13px] text-mb-dim">
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-mb-text truncate leading-tight">
          {item.title}
        </span>
        <span className="block text-xs text-mb-muted truncate">{item.artistName}</span>
      </span>
      {rating != null && (
        <span
          className="shrink-0 font-mono font-bold text-[13px]"
          style={{ color: ratingColor(rating) }}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </Link>
  );
}

function TrendingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-2.5 py-2 animate-pulse">
          <div className="w-6 h-4 rounded bg-mb-input shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-mb-input" />
            <div className="h-3 w-1/3 rounded bg-mb-input" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTrending() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <p className="text-mb-muted text-sm">
        Todavía no hay suficientes reseñas para calcular el trending.
      </p>
    </div>
  );
}

export function TrendingClient() {
  const [tab, setTab] = useState<TrendingTab>("albums");

  const albumsQuery = useQuery({
    queryKey: ["trending", "albums"],
    queryFn: () => apiTrendingAlbums(20),
    enabled: tab === "albums",
    staleTime: 5 * 60 * 1000,
  });

  const tracksQuery = useQuery({
    queryKey: ["trending", "tracks"],
    queryFn: () => apiTrendingTracks(20),
    enabled: tab === "tracks",
    staleTime: 5 * 60 * 1000,
  });

  const activeQuery = tab === "albums" ? albumsQuery : tracksQuery;
  const items = (activeQuery.data?.data ?? []).map((row) => toItem(row, tab));
  const isLoading = activeQuery.isLoading;

  const top5 = items.slice(0, 5);
  const rest = items.slice(5, 20);

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <div className="max-w-[1000px] mx-auto px-6 md:px-[clamp(20px,3vw,48px)] py-9">
        <header className="mb-7">
          <h1 className="font-serif font-normal text-[32px] leading-tight text-mb-text">
            Trending ahora
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-mb-border mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-11 px-4 bg-transparent border-none text-sm cursor-pointer whitespace-nowrap transition-colors -mb-px",
                tab === t.id
                  ? "border-b-2 border-mb-primary text-mb-text font-semibold"
                  : "border-b-2 border-transparent text-mb-muted font-medium hover:text-mb-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <TrendingSkeleton />
        ) : items.length === 0 ? (
          <EmptyTrending />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="flex flex-col gap-1">
              {top5.map((item, i) => (
                <TopRow key={item.deezerId} item={item} rank={i + 1} />
              ))}
            </div>
            <div className="flex flex-col">
              {rest.map((item, i) => (
                <RestRow key={item.deezerId} item={item} rank={i + 6} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
