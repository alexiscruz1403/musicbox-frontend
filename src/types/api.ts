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
