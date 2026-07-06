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

export type ReactionType = "LIKE" | "DISLIKE";

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
  userReaction: ReactionType | null;
  // Target (album/track) info — only populated in contexts spanning multiple
  // targets (e.g. the Feed). Undefined on album/track detail pages, where the
  // target is already implicit from page context.
  targetType?: ReviewType;
  targetDeezerId?: string;
  externalTitle?: string;
  externalArtistName?: string;
  externalCoverUrl?: string | null;
}

export interface ReviewsResponse {
  items: CatalogReview[];
  nextCursor: string | null;
}

export interface FeedResponse {
  items: CatalogReview[];
  nextCursor: string | null;
}

export type FeedType = "FOLLOWED" | "ALL";

// ─── Reviews (Fase 3) — create/detail/history ─────────────────────────────────

export type ReviewType = "TRACK" | "ALBUM";

export interface TrackReviewItemDto {
  deezerId: string;
  rating: number;
  description?: string;
}

export interface CreateReviewDto {
  type: ReviewType;
  deezerId: string;
  description: string;
  rating?: number;
  trackItems?: TrackReviewItemDto[];
}

export interface UpdateReviewDto {
  description?: string;
  rating?: number;
  trackItems?: TrackReviewItemDto[];
}

export interface Review {
  id: string;
  userId: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TrackReviewItem {
  deezerId?: string;
  title?: string;
  trackNumber?: number | null;
  rating: number;
  description: string | null;
}

export interface ReviewDetail {
  id: string;
  userId: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  externalTitle?: string;
  externalArtistName?: string;
  externalCoverUrl?: string | null;
  targetDeezerId?: string;
  trackReviewItems?: TrackReviewItem[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
}

export interface UserReviewHistoryItem {
  id: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  externalTitle?: string;
  externalArtistName?: string;
  externalCoverUrl?: string | null;
  targetDeezerId?: string;
  avatarUrl?: string | null;
}

export interface UserReviewHistoryResponse {
  items: UserReviewHistoryItem[];
  nextCursor: string | null;
}

// ─── Trending (Fase 5) ───────────────────────────────────────────────────────

export interface TrendingAlbum {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface TrendingTrack {
  deezerId: string;
  title: string;
  artist: CatalogArtist;
  coverUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  albumDeezerId: string | null;
}

// ─── Notifications (Fase 5) ──────────────────────────────────────────────────

export type NotificationType = "LIKE" | "DISLIKE" | "COMMENT" | "FOLLOW";

export interface NotificationActor {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationReviewRef {
  id: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
}

export interface NotificationRow {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  reviewId: string | null;
  commentId: string | null;
  actorCount: number | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor;
  review: NotificationReviewRef | null;
}

export interface NotificationsResponse {
  items: NotificationRow[];
  nextCursor: string | null;
}

// ─── Social (Fase 4) — comments, follow suggestions ───────────────────────────

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface CommentsResponse {
  items: Comment[];
  nextCursor: string | null;
}

export interface FollowSuggestion {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface UserSearchResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export interface UserSearchResponse {
  items: UserSearchResult[];
  nextCursor: string | null;
}
