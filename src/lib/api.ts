import type {
  ApiSuccessResponse,
  AuthResponse,
  MessageResponse,
  MeResponse,
  PublicProfileResponse,
  HandleCheckResponse,
  AvatarUploadResponse,
  RefreshResponse,
  CatalogAlbum,
  CatalogTrack,
  CatalogPage,
  CatalogSearchResult,
  CatalogSearchType,
  ReviewsResponse,
  CatalogReview,
  TrendingAlbum,
  TrendingTrack,
  RecommendationsResponse,
  CreateReviewDto,
  UpdateReviewDto,
  Review,
  ReviewType,
  ReviewDetail,
  UserReviewHistoryResponse,
  ReactionType,
  Comment,
  CommentsResponse,
  FollowSuggestion,
  FeedResponse,
  FeedType,
  UserSearchResult,
  UserSearchResponse,
  NotificationRow,
  NotificationsResponse,
  ReportTargetType,
  ReportStatus,
  AdminReportRow,
  AdminReportsResponse,
  CreateReportDto,
  CreatedReport,
  ExportDataResponse,
  NotificationPreferences,
  NotificationPrefsUpdate,
} from "@/types/api";
import { tokenStore } from "@/lib/token-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleError(res: Response): Promise<never> {
  let code = "INTERNAL_ERROR";
  let message = res.statusText || "Unknown error";
  try {
    const body = (await res.json()) as {
      error?: { code: string; message: string };
    };
    if (body.error) {
      code = body.error.code;
      message = body.error.message;
    }
  } catch {
    // body not JSON
  }
  throw new ApiError(code, message, res.status);
}

interface FetchOptions extends RequestInit {
  accessToken?: string;
}

async function doFetch(
  path: string,
  token: string | undefined,
  options: Omit<FetchOptions, "accessToken">,
): Promise<Response> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE}${path}`, { ...rest, body, headers });
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { accessToken: explicitToken, ...rest } = options;
  const token = explicitToken ?? tokenStore.getAccessToken() ?? undefined;
  const hadToken = !!token;

  let res = await doFetch(path, token, rest);

  if (res.status === 401 && hadToken) {
    const refreshed = await tokenStore.refresh();
    if (refreshed) {
      res = await doFetch(path, tokenStore.getAccessToken() ?? undefined, rest);
    } else {
      throw new ApiError(
        "SESSION_EXPIRED",
        "Tu sesión expiró. Por favor iniciá sesión de nuevo.",
        401,
      );
    }
  }

  if (!res.ok) {
    return handleError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// Auth endpoints

export async function apiRegister(payload: {
  handle: string;
  displayName: string;
  email: string;
  password: string;
  consent: true;
  idempotencyKey: string;
}): Promise<ApiSuccessResponse<AuthResponse>> {
  const { idempotencyKey, ...body } = payload;
  return apiFetch<ApiSuccessResponse<AuthResponse>>("/auth/register", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<ApiSuccessResponse<AuthResponse>> {
  return apiFetch<ApiSuccessResponse<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiForgotPassword(
  email: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(
  userId: string,
  token: string,
  newPassword: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ userId, token, newPassword }),
  });
}

export async function apiChangeEmail(
  accessToken: string,
  newEmail: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/change-email", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ newEmail }),
  });
}

export async function apiConfirmChangeEmail(
  userId: string,
  token: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/confirm-change-email", {
    method: "POST",
    body: JSON.stringify({ userId, token }),
  });
}

export async function apiRefresh(
  refreshToken: string,
): Promise<ApiSuccessResponse<RefreshResponse>> {
  return apiFetch<ApiSuccessResponse<RefreshResponse>>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiLogout(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ refreshToken }),
  });
}

// User endpoints

export async function apiGetMe(
  accessToken: string,
): Promise<ApiSuccessResponse<MeResponse>> {
  return apiFetch<ApiSuccessResponse<MeResponse>>("/users/me", { accessToken });
}

export async function apiPatchMe(
  accessToken: string,
  updates: { handle?: string; displayName?: string; bio?: string },
): Promise<ApiSuccessResponse<{ user: MeResponse["user"] }>> {
  return apiFetch<ApiSuccessResponse<{ user: MeResponse["user"] }>>(
    "/users/me",
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(updates),
    },
  );
}

export async function apiUploadAvatar(
  accessToken: string,
  file: File,
): Promise<ApiSuccessResponse<AvatarUploadResponse>> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ApiSuccessResponse<AvatarUploadResponse>>(
    "/users/me/avatar",
    {
      method: "POST",
      accessToken,
      body: form,
    },
  );
}

export async function apiGetProfile(
  handle: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<PublicProfileResponse>> {
  return apiFetch<ApiSuccessResponse<PublicProfileResponse>>(
    `/users/${handle}`,
    { accessToken },
  );
}

export async function apiCheckHandle(
  handle: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<HandleCheckResponse>> {
  return apiFetch<ApiSuccessResponse<HandleCheckResponse>>(
    `/users/check-handle?handle=${encodeURIComponent(handle)}`,
    { accessToken },
  );
}

export async function apiFollow(
  handle: string,
  accessToken: string,
): Promise<void> {
  return apiFetch<void>(`/users/${handle}/follow`, {
    method: "POST",
    accessToken,
  });
}

export async function apiUnfollow(
  handle: string,
  accessToken: string,
): Promise<void> {
  return apiFetch<void>(`/users/${handle}/follow`, {
    method: "DELETE",
    accessToken,
  });
}

// Catalog endpoints

export async function apiCatalogSearch(
  q: string,
  type: CatalogSearchType,
  limit = 20,
  cursor?: string,
): Promise<ApiSuccessResponse<CatalogPage<CatalogSearchResult>>> {
  const params = new URLSearchParams({ q, type, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<CatalogPage<CatalogSearchResult>>>(
    `/catalog/search?${params}`,
  );
}

export async function apiCatalogAlbum(
  deezerId: string,
): Promise<ApiSuccessResponse<CatalogAlbum>> {
  return apiFetch<ApiSuccessResponse<CatalogAlbum>>(
    `/catalog/albums/${deezerId}`,
  );
}

export async function apiCatalogTrack(
  deezerId: string,
): Promise<ApiSuccessResponse<CatalogTrack>> {
  return apiFetch<ApiSuccessResponse<CatalogTrack>>(
    `/catalog/tracks/${deezerId}`,
  );
}

// Reviews (Fase 3)
//
// The backend's listing endpoints (/albums/:id/reviews, /tracks/:id/reviews,
// /users/:handle/reviews) respond with { data: Row[], meta: { cursor } } — a flat
// array in `data` plus the cursor in `meta`, NOT the nested { items, nextCursor }
// shape used by the Catalog module. The functions below fetch that raw envelope
// and normalize it into the { items, nextCursor } shape the rest of the frontend
// expects. Raw row shapes come from ReviewsRepository/ReviewsController in
// musicbox-api (not fully documented in fase-3-features.md).

interface RawListEnvelope<T> {
  data: T[];
  meta: { cursor: string | null };
}

interface RawReviewUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

interface RawReviewListRow {
  id: string;
  rating: string;
  description: string;
  createdAt: string;
  user: RawReviewUser;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
}

function toCatalogReview(row: RawReviewListRow): CatalogReview {
  return {
    id: row.id,
    user: {
      handle: row.user.handle,
      displayName: row.user.displayName,
      avatarUrl: row.user.avatarUrl,
    },
    rating: Number(row.rating),
    description: row.description,
    likesCount: row.likesCount,
    dislikesCount: row.dislikesCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
    createdAt: row.createdAt,
  };
}

interface RawUserReviewRow {
  id: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
  // Flattened onto the row by ReviewsService.listByUserHandle (no nested
  // `user` object here — the caller already knows whose history this is).
  avatarUrl: string | null;
}

interface RawTrackReviewItem {
  id: string;
  trackId: string;
  rating: number;
  description: string | null;
  position: number;
  // Nested Track relation — ReviewsRepository.findById includes it so the UI
  // can show the real track title instead of a "Canción N" placeholder.
  track?: { deezerId: string; title: string; trackNumber: number | null } | null;
}

interface RawReviewDetail {
  id: string;
  userId: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
  trackReviewItems?: RawTrackReviewItem[];
  album: { deezerId: string } | null;
  track: { deezerId: string } | null;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
  // Kept optional so older backend deployments (or a query without the
  // include) still degrade to a "Usuario" fallback instead of crashing.
  user?: RawReviewUser;
}

function toReviewDetail(row: RawReviewDetail): ReviewDetail {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    rating: row.rating,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: row.user
      ? { handle: row.user.handle, displayName: row.user.displayName, avatarUrl: row.user.avatarUrl }
      : { handle: "", displayName: "Usuario", avatarUrl: null },
    externalTitle: row.externalTitle,
    externalArtistName: row.externalArtistName,
    externalCoverUrl: row.externalCoverUrl,
    targetDeezerId: row.album?.deezerId ?? row.track?.deezerId,
    trackReviewItems: row.trackReviewItems?.map((item) => ({
      deezerId: item.track?.deezerId,
      title: item.track?.title,
      trackNumber: item.track?.trackNumber ?? item.position,
      rating: item.rating,
      description: item.description,
    })),
    likesCount: row.likesCount,
    dislikesCount: row.dislikesCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
  };
}

export async function apiCreateReview(
  accessToken: string,
  payload: CreateReviewDto,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<Review>> {
  return apiFetch<ApiSuccessResponse<Review>>("/reviews", {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function apiGetReview(
  id: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<ReviewDetail>> {
  const raw = await apiFetch<ApiSuccessResponse<RawReviewDetail>>(`/reviews/${id}`, {
    accessToken,
  });
  return { data: toReviewDetail(raw.data) };
}

export async function apiUpdateReview(
  accessToken: string,
  id: string,
  payload: UpdateReviewDto,
): Promise<ApiSuccessResponse<Review>> {
  return apiFetch<ApiSuccessResponse<Review>>(`/reviews/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteReview(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch<void>(`/reviews/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function apiUserReviews(
  handle: string,
  cursor?: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<UserReviewHistoryResponse>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  const raw = await apiFetch<RawListEnvelope<RawUserReviewRow>>(
    `/users/${handle}/reviews${qs ? `?${qs}` : ""}`,
    { accessToken },
  );
  return {
    data: {
      items: raw.data.map((row) => ({
        id: row.id,
        type: row.type,
        rating: row.rating,
        description: row.description,
        createdAt: row.createdAt,
        externalTitle: row.externalTitle,
        externalArtistName: row.externalArtistName,
        externalCoverUrl: row.externalCoverUrl,
        avatarUrl: row.avatarUrl,
      })),
      nextCursor: raw.meta.cursor,
    },
  };
}

export async function apiAlbumReviews(
  deezerId: string,
  sort: "recent" | "rating" = "recent",
  cursor?: string,
): Promise<ApiSuccessResponse<ReviewsResponse>> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<RawReviewListRow>>(
    `/albums/${deezerId}/reviews?${params}`,
  );
  return { data: { items: raw.data.map(toCatalogReview), nextCursor: raw.meta.cursor } };
}

export async function apiTrackReviews(
  deezerId: string,
  sort: "recent" | "rating" = "recent",
  cursor?: string,
): Promise<ApiSuccessResponse<ReviewsResponse>> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<RawReviewListRow>>(
    `/tracks/${deezerId}/reviews?${params}`,
  );
  return { data: { items: raw.data.map(toCatalogReview), nextCursor: raw.meta.cursor } };
}

// Social (Fase 4) — reactions, comments, feed, follow suggestions

export async function apiSetReaction(
  accessToken: string,
  reviewId: string,
  type: ReactionType,
  idempotencyKey: string,
): Promise<void> {
  await apiFetch<ApiSuccessResponse<unknown>>(`/reviews/${reviewId}/reactions`, {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ type }),
  });
}

export async function apiRemoveReaction(
  accessToken: string,
  reviewId: string,
): Promise<void> {
  return apiFetch<void>(`/reviews/${reviewId}/reactions`, {
    method: "DELETE",
    accessToken,
  });
}

interface RawComment {
  id: string;
  content: string;
  createdAt: string;
  // Kept optional so a response without the include still degrades to a
  // "Usuario" fallback instead of crashing, same convention as toReviewDetail.
  user?: RawReviewUser;
}

function toComment(row: RawComment): Comment {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    userId: row.user?.id ?? "",
    user: row.user
      ? { handle: row.user.handle, displayName: row.user.displayName, avatarUrl: row.user.avatarUrl }
      : { handle: "", displayName: "Usuario", avatarUrl: null },
  };
}

export async function apiGetComments(
  reviewId: string,
  cursor?: string,
  limit = 10,
): Promise<ApiSuccessResponse<CommentsResponse>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<RawComment>>(
    `/reviews/${reviewId}/comments?${params}`,
  );
  return { data: { items: raw.data.map(toComment), nextCursor: raw.meta.cursor } };
}

export async function apiCreateComment(
  accessToken: string,
  reviewId: string,
  content: string,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<Comment>> {
  const raw = await apiFetch<ApiSuccessResponse<RawComment>>(
    `/reviews/${reviewId}/comments`,
    {
      method: "POST",
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ content }),
    },
  );
  return { data: toComment(raw.data) };
}

export async function apiDeleteComment(
  accessToken: string,
  commentId: string,
): Promise<void> {
  return apiFetch<void>(`/comments/${commentId}`, {
    method: "DELETE",
    accessToken,
  });
}

// Feed row shape isn't spelled out verbatim in fase-4-features.md beyond "each
// item includes consolidated stats" — modeled on RawReviewDetail (minus
// trackReviewItems, which Feed cards don't need) since the doc states Feed and
// Reviews/Album/Track listings all merge stats through the same shared
// SocialService.getReviewStats(). Verify field names against the live API.
interface RawFeedRow {
  id: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
  album: { deezerId: string } | null;
  track: { deezerId: string } | null;
  user?: RawReviewUser;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
}

function toFeedReview(row: RawFeedRow): CatalogReview {
  return {
    id: row.id,
    user: row.user
      ? { handle: row.user.handle, displayName: row.user.displayName, avatarUrl: row.user.avatarUrl }
      : { handle: "", displayName: "Usuario", avatarUrl: null },
    rating: Number(row.rating),
    description: row.description,
    likesCount: row.likesCount,
    dislikesCount: row.dislikesCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
    createdAt: row.createdAt,
    targetType: row.type,
    targetDeezerId: row.album?.deezerId ?? row.track?.deezerId,
    externalTitle: row.externalTitle,
    externalArtistName: row.externalArtistName,
    externalCoverUrl: row.externalCoverUrl,
  };
}

export async function apiFeed(
  accessToken: string,
  type: FeedType = "FOLLOWED",
  cursor?: string,
  limit = 20,
): Promise<ApiSuccessResponse<FeedResponse>> {
  const params = new URLSearchParams({ type, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<RawFeedRow>>(`/feed?${params}`, {
    accessToken,
  });
  return { data: { items: raw.data.map(toFeedReview), nextCursor: raw.meta.cursor } };
}

export async function apiFollowSuggestions(
  accessToken: string,
): Promise<ApiSuccessResponse<FollowSuggestion[]>> {
  return apiFetch<ApiSuccessResponse<FollowSuggestion[]>>("/follow-suggestions", {
    accessToken,
  });
}

// User search response shape already matches UserSearchResult field-for-field
// (id, handle, displayName, avatarUrl, isFollowing) — no separate raw/map layer
// needed, unlike RawFeedRow. Verify field names against the live API.
export async function apiSearchUsers(
  q: string,
  cursor?: string,
  limit = 10,
  accessToken?: string,
): Promise<ApiSuccessResponse<UserSearchResponse>> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<UserSearchResult>>(
    `/users/search?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

// Trending (Fase 5)

export async function apiTrendingAlbums(
  limit = 20,
): Promise<ApiSuccessResponse<TrendingAlbum[]>> {
  return apiFetch<ApiSuccessResponse<TrendingAlbum[]>>(
    `/trending/albums?limit=${limit}`,
  );
}

export async function apiTrendingTracks(
  limit = 20,
): Promise<ApiSuccessResponse<TrendingTrack[]>> {
  return apiFetch<ApiSuccessResponse<TrendingTrack[]>>(
    `/trending/tracks?limit=${limit}`,
  );
}

// Notifications (Fase 5)

export async function apiNotifications(
  accessToken: string,
  options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {},
): Promise<ApiSuccessResponse<NotificationsResponse>> {
  const { cursor, limit = 20, unreadOnly = false } = options;
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (unreadOnly) params.set("unreadOnly", "true");
  const raw = await apiFetch<RawListEnvelope<NotificationRow>>(
    `/notifications?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiMarkNotificationRead(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, {
    method: "PATCH",
    accessToken,
  });
}

export async function apiMarkAllNotificationsRead(
  accessToken: string,
): Promise<void> {
  return apiFetch<void>("/notifications/read-all", {
    method: "POST",
    accessToken,
  });
}

// Recommendations (Fase 6)

export async function apiGetRecommendations(
  accessToken: string,
): Promise<ApiSuccessResponse<RecommendationsResponse> | null> {
  const result = await apiFetch<ApiSuccessResponse<RecommendationsResponse> | undefined>(
    "/recommendations",
    { accessToken },
  );
  return result ?? null;
}

// Moderation (Fase 7)

export async function apiCreateReport(
  accessToken: string,
  payload: CreateReportDto,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<CreatedReport>> {
  return apiFetch<ApiSuccessResponse<CreatedReport>>("/reports", {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function apiAdminListReports(
  accessToken: string,
  options: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ApiSuccessResponse<AdminReportsResponse>> {
  const { status, targetType, cursor, limit = 20 } = options;
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set("status", status);
  if (targetType) params.set("targetType", targetType);
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<AdminReportRow>>(
    `/admin/reports?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiAdminUpdateReportStatus(
  accessToken: string,
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
): Promise<void> {
  return apiFetch<void>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export async function apiExportUserData(
  accessToken: string,
): Promise<ApiSuccessResponse<ExportDataResponse>> {
  return apiFetch<ApiSuccessResponse<ExportDataResponse>>("/users/me/export", {
    accessToken,
  });
}

export async function apiDeleteMe(accessToken: string): Promise<void> {
  return apiFetch<void>("/users/me", {
    method: "DELETE",
    accessToken,
  });
}

// Notification preferences (Fase 1)

export async function apiGetNotificationPrefs(
  accessToken: string,
): Promise<ApiSuccessResponse<NotificationPreferences>> {
  return apiFetch<ApiSuccessResponse<NotificationPreferences>>(
    "/users/me/notifications-prefs",
    { accessToken },
  );
}

export async function apiUpdateNotificationPrefs(
  accessToken: string,
  updates: NotificationPrefsUpdate,
): Promise<ApiSuccessResponse<NotificationPreferences>> {
  return apiFetch<ApiSuccessResponse<NotificationPreferences>>(
    "/users/me/notifications-prefs",
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(updates),
    },
  );
}
