// ─── Catalog (Fase 2) ────────────────────────────────────────────────────────

export interface CatalogArtist {
  deezerId: string;
  name: string;
  imageUrl: string | null;
  // Present on GET /catalog/artists/:deezerId and artist search-result items —
  // absent when this artist appears nested inside a CatalogAlbum/CatalogTrack.
  reviewCount?: number;
}

export interface CatalogTrack {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  albumDeezerId: string | null;
  albumTitle: string | null;
  coverUrl: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  trackNumber: number | null;
  previewUrl: string | null;
  // Present on GET /catalog/tracks/:deezerId, track search-result items, and
  // tracks nested in a GET /catalog/albums/:deezerId tracklist (userRating
  // only, sourced from the album review's per-track item there — see
  // docs/fase-2-features.md). Absent from artist album/track listings.
  reviewCount?: number;
  userRating?: number | null;
}

export interface CatalogAlbum {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  releaseDate: string | null;
  genreLabel: string | null;
  tracks: CatalogTrack[];
  // Present on GET /catalog/albums/:deezerId and album search-result items —
  // absent from GET /catalog/artists/:deezerId/albums listings.
  reviewCount?: number;
  userRating?: number | null;
}

export interface CatalogPage<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export type CatalogSearchType = "album" | "track" | "artist";

export type CatalogSearchResult =
  | { type: "artist"; item: CatalogArtist }
  | { type: "album"; item: CatalogAlbum }
  | { type: "track"; item: CatalogTrack };

export interface CatalogQuickSearchItem {
  type: CatalogSearchType;
  deezerId: string;
  coverUrl: string | null;
  title: string;
  artist: string | null;
  albumsCount?: number;
}

export interface CatalogSearchHistoryItem {
  id: string;
  query: string;
  type: CatalogSearchType;
  searchedAt: string;
}

export type CatalogResourceType = "ARTIST" | "ALBUM" | "TRACK";

export interface RecentlyViewedItem {
  resourceType: CatalogResourceType;
  deezerId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  albumsCount: number | null;
  viewedAt: string;
}

// ─── Catalog: Artist detail ──────────────────────────────────────────────────

export type ArtistTopAlbum = CatalogAlbum & {
  reviewCount: number;
  avgRating: number | null;
};

export type ArtistTopTrack = CatalogTrack & {
  reviewCount: number;
  avgRating: number | null;
};

// Item shape returned by GET /catalog/artists/:deezerId/tracks — adds the
// parent album's title, which isn't part of the base CatalogTrack shape
// returned by getAlbum/getTrack/getArtistAlbums.
export type ArtistTrackItem = CatalogTrack & {
  albumTitle: string | null;
};

export interface ArtistDetail {
  artist: CatalogArtist;
  topReviewedAlbums: ArtistTopAlbum[];
  topReviewedTracks: ArtistTopTrack[];
  trendingAlbums: ArtistTopAlbum[];
  trendingTracks: ArtistTopTrack[];
}

// ─── Catalog: recently-viewed detail bundle (Fase 8 — offline prefetch) ──────

export type CatalogResourceDetail = CatalogAlbum | CatalogTrack | ArtistDetail;

export interface RecentlyViewedDetailItem {
  resourceType: CatalogResourceType;
  deezerId: string;
  viewedAt: string;
  detail: CatalogResourceDetail | null;
  error: { code: string; message: string } | null;
}
