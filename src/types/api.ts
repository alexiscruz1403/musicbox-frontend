export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface AuthUser {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  status: "ACTIVE" | "DELETED";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserStats {
  reviewCount: number;
  followersCount: number;
  followingCount: number;
}

export interface MeResponse {
  user: AuthUser & {
    bio?: string | null;
    emailVerifiedAt?: string | null;
    createdAt: string;
  };
  stats: UserStats;
}

export interface PublicUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status: "ACTIVE" | "DELETED";
  createdAt: string;
}

export interface PublicProfileResponse {
  user: PublicUser;
  stats: UserStats;
  isFollowing?: boolean;
}

export interface HandleCheckResponse {
  available: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface FollowerItem {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PaginatedFollowersResponse {
  items: FollowerItem[];
  nextCursor: string | null;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface CatalogArtist {
  deezerId: string;
  name: string;
  imageUrl: string | null;
}

export interface CatalogTrack {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  albumDeezerId: string | null;
  coverUrl: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  trackNumber: number | null;
  previewUrl: string | null;
}

export interface CatalogAlbum {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  releaseDate: string | null;
  genreLabel: string | null;
  tracks: CatalogTrack[];
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

// ─── Reviews (Fase 3) ────────────────────────────────────────────────────────

export interface CatalogReview {
  id: string;
  user: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  rating: number;
  description: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  createdAt: string;
  userReaction: "LIKE" | "DISLIKE" | null;
}

export interface ReviewsResponse {
  items: CatalogReview[];
  nextCursor: string | null;
}

// ─── Trending (Fase 5) ───────────────────────────────────────────────────────

export interface TrendingAlbum {
  deezerId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}
