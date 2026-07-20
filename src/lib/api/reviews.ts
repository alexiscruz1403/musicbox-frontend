import type {
  ApiSuccessResponse,
  ReviewsResponse,
  CatalogReview,
  CreateReviewDto,
  UpdateReviewDto,
  Review,
  ReviewType,
  ReviewDetail,
  UserReviewHistoryResponse,
  ReactionType,
} from "@/types/api";
import { apiFetch, type RawListEnvelope, type RawReviewUser } from "./client";

// Reviews (Fase 3)
//
// El backend de ReviewsModule no sigue el shape de CatalogModule para
// listados paginados — ver el comentario de RawListEnvelope en ./client.
// Las funciones de este archivo normalizan la respuesta cruda al shape
// { items, nextCursor } que el resto de la app espera. Row shapes vienen de
// ReviewsRepository/ReviewsController en vinlyst-api (no completamente
// documentado en fase-3-features.md).

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
      rating: Number(item.rating),
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
  idempotencyKey: string,
): Promise<ApiSuccessResponse<Review>> {
  return apiFetch<ApiSuccessResponse<Review>>(`/reviews/${id}`, {
    method: "PATCH",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteReview(
  accessToken: string,
  id: string,
  idempotencyKey: string,
): Promise<void> {
  return apiFetch<void>(`/reviews/${id}`, {
    method: "DELETE",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function apiUserReviews(
  handle: string,
  cursor?: string,
  accessToken?: string,
  sort: "recent" | "oldest" | "best" | "worst" = "recent",
  q?: string,
): Promise<ApiSuccessResponse<UserReviewHistoryResponse>> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);
  if (q) params.set("q", q);
  const raw = await apiFetch<RawListEnvelope<RawUserReviewRow>>(
    `/users/${handle}/reviews?${params}`,
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
