import type { CatalogReview } from "./reviews";

// ─── Social (Fase 4) — feed, comments, follow suggestions, búsqueda de usuarios

export interface FeedResponse {
  items: CatalogReview[];
  nextCursor: string | null;
}

export type FeedType = "FOLLOWED" | "ALL";

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
