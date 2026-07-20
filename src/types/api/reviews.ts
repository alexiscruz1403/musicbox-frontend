// ─── Reviews (Fase 3) ────────────────────────────────────────────────────────

export type ReactionType = "LIKE" | "DISLIKE";

export type ReviewType = "TRACK" | "ALBUM";

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
