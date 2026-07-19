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
  coverUrl?: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  role: "USER" | "ADMIN";
  language: "EN" | "ES";
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

export interface MessageResponse {
  message: string;
}

export interface UserStats {
  reviewCount: number;
  followersCount: number;
  followingCount: number;
}

export interface MeResponse {
  user: AuthUser & {
    bio?: string | null;
    createdAt: string;
    isPrivate: boolean;
  };
  stats: UserStats;
}

export interface PublicUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  status: "ACTIVE" | "DELETED";
  createdAt: string;
  isPrivate: boolean;
}

export interface PublicProfileResponse {
  user: PublicUser;
  stats: UserStats;
  isFollowing?: boolean;
  // True when the viewer has an outgoing PENDING FollowRequest to this user
  // and isn't following yet — only meaningful when user.isPrivate is true.
  followRequestPending?: boolean;
}

// Result body of POST /users/:handle/follow (201) when the target is
// private — a direct follow (204, no body) is represented as `undefined`.
export interface FollowPendingResult {
  status: "PENDING";
  followRequestId: string;
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

export interface CoverUploadResponse {
  coverUrl: string;
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
  description?: string;
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

// ─── Notifications (Fase 5) ──────────────────────────────────────────────────

export type NotificationType =
  | "LIKE"
  | "DISLIKE"
  | "COMMENT"
  | "FOLLOW"
  | "MODERATION"
  | "FOLLOW_REQUEST"
  | "FOLLOW_REQUEST_ACCEPTED";

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
  actorId: string | null;
  type: NotificationType;
  reviewId: string | null;
  commentId: string | null;
  actorCount: number | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  review: NotificationReviewRef | null;
}

export interface NotificationsResponse {
  items: NotificationRow[];
  nextCursor: string | null;
}

// ─── Recommendations (Fase 6) ────────────────────────────────────────────────

export type RecommendationReason = "SIMILAR_ARTIST" | "GENRE_MATCH";

export interface RecommendationItem {
  deezerId: string;
  type: "album";
  title: string;
  artistName: string;
  coverUrl: string | null;
  reason: RecommendationReason;
  reasonLabel: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  generatedAt: string;
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

export interface FollowListItem {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  isFollowing: boolean;
}

export interface FollowListResponse {
  items: FollowListItem[];
  nextCursor: string | null;
}

export interface UserSearchResponse {
  items: UserSearchResult[];
  nextCursor: string | null;
}

export interface UserQuickSearchItem {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  isFollowing: boolean;
}

export interface UserSearchHistoryItem {
  id: string;
  query: string;
  searchedAt: string;
}

// ─── Private profiles — follow requests (post-Fase 7) ─────────────────────

export interface FollowRequestItem {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface FollowRequestsResponse {
  items: FollowRequestItem[];
  nextCursor: string | null;
}

export type FollowRequestResolution = "ACCEPTED" | "REJECTED";

// ─── Moderation (Fase 7) ───────────────────────────────────────────────────

export type ReportTargetType = "REVIEW" | "COMMENT" | "USER";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export interface ReportedContentReviewTrack {
  reviewType: "TRACK";
  description: string;
}

export interface ReportedContentReviewAlbum {
  reviewType: "ALBUM";
  description: string;
  trackDescriptions: { trackTitle: string; description: string | null }[];
}

export interface ReportedContentComment {
  content: string;
}

export interface ReportedContentUser {
  handle: string;
}

export type ReportedContent =
  | ReportedContentReviewTrack
  | ReportedContentReviewAlbum
  | ReportedContentComment
  | ReportedContentUser
  | null;

export interface AdminReportRow {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; handle: string; displayName: string };
  reportedContent: ReportedContent;
}

export interface AdminReportsResponse {
  items: AdminReportRow[];
  nextCursor: string | null;
}

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}

export interface CreatedReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: "PENDING";
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// Opaque envelope — the export button only serializes and downloads it.
export type ExportDataResponse = Record<string, unknown>;

// ─── Notification preferences (Fase 1) ─────────────────────────────────────

export interface NotificationPreferences {
  userId: string;
  likesEnabled: boolean;
  dislikesEnabled: boolean;
  commentsEnabled: boolean;
  // Named `followsEnabled` by the live backend — docs/fase-1-features.md
  // documents it as `followersEnabled`, but that 400s in practice.
  // Post-Fase 7: the backend returns exactly one of `followsEnabled` /
  // `followRequestsEnabled`, never both — which one depends on the current
  // user's `isPrivate` (public accounts get `followsEnabled`, private
  // accounts get `followRequestsEnabled`). See docs/fase-7-features.md.
  followsEnabled?: boolean;
  followRequestsEnabled?: boolean;
  // Documented in docs/fase-1-features.md but has no UI in the design —
  // read on GET, never written back by this app. See NotificationPrefsUpdate.
  reviewsEnabled: boolean;
}

export type NotificationPrefsUpdate = Partial<
  Pick<
    NotificationPreferences,
    | "likesEnabled"
    | "dislikesEnabled"
    | "commentsEnabled"
    | "followsEnabled"
    | "followRequestsEnabled"
  >
>;

// ─── Web Push (Fase 8) ──────────────────────────────────────────────────────

export interface VapidPublicKeyResponse {
  publicKey: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
