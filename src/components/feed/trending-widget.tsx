"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiTrendingAlbums } from "@/lib/api";
import { ratingColor, coverGradient } from "@/lib/review-format";

export function TrendingWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending", "albums", "widget"],
    queryFn: () => apiTrendingAlbums(5),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.data ?? [];

  return (
    <section className="bg-mb-card border border-mb-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold tracking-wide uppercase text-mb-muted">
          Trending ahora
        </h2>
        <Link
          href="/trending"
          className="text-xs font-medium text-mb-accent hover:underline"
        >
          Ver todo
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="w-10 h-10 rounded-md bg-mb-input shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-mb-input" />
                <div className="h-3 w-1/3 rounded bg-mb-input" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-mb-dim">Todavía no hay suficientes reseñas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((album, i) => (
            <Link
              key={album.deezerId}
              href={`/album/${album.deezerId}`}
              className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-mb-input"
            >
              <span className="shrink-0 w-4 text-center font-mono text-xs text-mb-dim">
                {i + 1}
              </span>
              <span
                className="shrink-0 w-10 h-10 rounded-md"
                style={
                  album.coverUrl
                    ? { backgroundImage: `url(${album.coverUrl})`, backgroundSize: "cover" }
                    : { background: coverGradient(album.deezerId) }
                }
                role="img"
                aria-label={`Cover de ${album.title}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-mb-text truncate">{album.title}</span>
                <span className="block text-xs text-mb-muted truncate">
                  {album.artist.name}
                </span>
              </span>
              {album.avgRating != null && (
                <span
                  className="shrink-0 font-mono font-bold text-xs"
                  style={{ color: ratingColor(album.avgRating) }}
                >
                  {album.avgRating.toFixed(1)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
