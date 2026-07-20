import type { AuthUser } from "./auth";

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

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface CoverUploadResponse {
  coverUrl: string;
}

// Tipo legacy sin call sites reales — superado por FollowListItem/
// FollowListResponse (post-Fase 7, más abajo). Se mantiene solo para no
// romper builds si algo externo lo importa; candidato a eliminar en una
// futura pasada de limpieza. Ver docs/musicbox-frontend-guide.md §9.12.
export interface FollowerItem {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
}

/** @deprecated Sin call sites — ver el comentario de FollowerItem. */
export interface PaginatedFollowersResponse {
  items: FollowerItem[];
  nextCursor: string | null;
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
