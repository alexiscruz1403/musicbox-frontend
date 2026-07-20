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

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
