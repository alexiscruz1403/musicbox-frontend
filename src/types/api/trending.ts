import type { CatalogArtist } from "./catalog";

// ─── Trending (Fase 5) ───────────────────────────────────────────────────────

export interface TrendingAlbum {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  rank: number;
  rankChange: number | null;
}

export interface TrendingTrack {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  albumDeezerId: string | null;
  rank: number;
  rankChange: number | null;
}
