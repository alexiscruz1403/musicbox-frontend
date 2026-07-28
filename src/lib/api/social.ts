import type {
  ApiSuccessResponse,
  ReactionType,
  Comment,
  CommentsResponse,
  FollowSuggestion,
  FeedResponse,
  FeedType,
  CatalogReview,
  FeedItem,
  ReviewType,
  SocialTarget,
  Tierlist,
  UserSearchResult,
  UserSearchResponse,
  UserQuickSearchItem,
  UserSearchHistoryItem,
} from "@/types/api";
import { apiFetch, type RawListEnvelope, type RawReviewUser } from "./client";

// Social (Fase 4) — reactions, comments, feed, follow suggestions, búsqueda
// de usuarios
//
// Reacciones y comentarios aceptan dos targets (`reviews` | `tierlists`): las
// rutas de tierlist son un espejo exacto de las de reseña — mismo body, mismos
// guards, mismos errores —, así que el target solo elige el prefijo. Default
// "reviews" para no tocar los call sites previos a tierlists.

export async function apiSetReaction(
  accessToken: string,
  targetId: string,
  type: ReactionType,
  idempotencyKey: string,
  target: SocialTarget = "reviews",
): Promise<void> {
  await apiFetch<ApiSuccessResponse<unknown>>(`/${target}/${targetId}/reactions`, {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ type }),
  });
}

export async function apiRemoveReaction(
  accessToken: string,
  targetId: string,
  target: SocialTarget = "reviews",
): Promise<void> {
  return apiFetch<void>(`/${target}/${targetId}/reactions`, {
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
  targetId: string,
  cursor?: string,
  limit = 10,
  target: SocialTarget = "reviews",
): Promise<ApiSuccessResponse<CommentsResponse>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<RawComment>>(
    `/${target}/${targetId}/comments?${params}`,
  );
  return { data: { items: raw.data.map(toComment), nextCursor: raw.meta.cursor } };
}

export async function apiCreateComment(
  accessToken: string,
  targetId: string,
  content: string,
  idempotencyKey: string,
  target: SocialTarget = "reviews",
): Promise<ApiSuccessResponse<Comment>> {
  const raw = await apiFetch<ApiSuccessResponse<RawComment>>(
    `/${target}/${targetId}/comments`,
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
// item includes consolidated stats" — modeled on the raw review-detail row
// (minus trackReviewItems, which Feed cards don't need) since the doc states
// Feed and Reviews/Album/Track listings all merge stats through the same
// shared SocialService.getReviewStats(). Verify field names against the live API.
interface RawFeedReviewRow {
  resourceType: "REVIEW";
  id: string;
  type: ReviewType;
  rating: string;
  description: string;
  createdAt: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
  // `albumId`/`trackId` son los UUID **internos** del recurso reseñado: no
  // sirven para armar una URL, sólo dicen de qué tipo es la reseña (la CHECK
  // `reviews_type_target_check` garantiza que haya exactamente uno seteado).
  // El deezerId con el que se linkea viene aparte, en `resourceId`.
  albumId: string | null;
  trackId: string | null;
  resourceId: string | null;
  user?: RawReviewUser;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
}

// Los items TIERLIST ya llegan con el shape de `Tierlist` (incluidos los 7
// `tiers` completos) — no necesitan un mapeo campo a campo como las reseñas.
type RawFeedTierlistRow = { resourceType: "TIERLIST" } & Tierlist;

type RawFeedRow = RawFeedReviewRow | RawFeedTierlistRow;

function toFeedReview(row: RawFeedReviewRow): CatalogReview {
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
    // El tipo de destino lo marca cuál de los dos ids internos vino (si
    // llegaran los dos, gana la canción por ser el recurso más específico);
    // el deezerId con el que se arma la URL siempre sale de `resourceId`.
    targetType: row.trackId ? "TRACK" : row.albumId ? "ALBUM" : row.type,
    targetDeezerId: row.resourceId ?? undefined,
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
  const items: FeedItem[] = raw.data.map((row) =>
    row.resourceType === "TIERLIST"
      ? row
      : { resourceType: "REVIEW", ...toFeedReview(row) },
  );
  return { data: { items, nextCursor: raw.meta.cursor } };
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

export async function apiUserQuickSearch(
  q: string,
): Promise<ApiSuccessResponse<UserQuickSearchItem[]>> {
  return apiFetch<ApiSuccessResponse<UserQuickSearchItem[]>>(
    `/users/quick-search?q=${encodeURIComponent(q)}`,
  );
}

export async function apiUserSearchHistory(
  accessToken: string,
): Promise<ApiSuccessResponse<UserSearchHistoryItem[]>> {
  return apiFetch<ApiSuccessResponse<UserSearchHistoryItem[]>>(
    "/users/search-history",
    { accessToken },
  );
}

export async function apiDeleteUserSearchHistoryItem(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch<void>(`/users/search-history/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function apiDeleteUserSearchHistory(
  accessToken: string,
): Promise<void> {
  return apiFetch<void>("/users/search-history", {
    method: "DELETE",
    accessToken,
  });
}
