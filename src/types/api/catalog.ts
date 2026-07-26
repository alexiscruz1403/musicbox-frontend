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
  // Genre names inherited from the track's album (Deezer has no per-track
  // genre). May be empty until the album is persisted — see docs/fase-2-features.md.
  genres: string[];
  // Present on GET /catalog/tracks/:deezerId, track search-result items, and
  // tracks nested in a GET /catalog/albums/:deezerId tracklist (userRating
  // only, sourced from the album review's per-track item there — see
  // docs/fase-2-features.md). Absent from artist album/track listings.
  reviewCount?: number;
  userRating?: number | null;
  // Present only on GET /catalog/tracks/:deezerId — id of the caller's active
  // TRACK review for this song, null if anonymous or unreviewed. Used to
  // deep-link into the review form's edit/preload flow. Not exposed in search
  // or nested listings.
  reviewId?: string | null;
}

export interface CatalogAlbum {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  releaseDate: string | null;
  // All of the album's genre names (Deezer returns several). Replaces the old
  // single `genreLabel` — present on detail/search. See docs/fase-2-features.md.
  genres: string[];
  tracks: CatalogTrack[];
  // Present on GET /catalog/albums/:deezerId and album search-result items —
  // absent from GET /catalog/artists/:deezerId/albums listings.
  reviewCount?: number;
  userRating?: number | null;
  // Present only on GET /catalog/albums/:deezerId — id of the caller's active
  // ALBUM review for this album, null if anonymous or unreviewed. Used to
  // deep-link into the review form's edit/preload flow. Not exposed in search
  // or nested listings.
  reviewId?: string | null;
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
