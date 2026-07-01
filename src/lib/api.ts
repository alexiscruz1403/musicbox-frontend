import type {
  ApiSuccessResponse,
  AuthResponse,
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
  TrendingAlbum,
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

// Reviews (Fase 3 — backend not yet implemented)

export async function apiAlbumReviews(
  deezerId: string,
  sort: "recent" | "rating" = "recent",
  cursor?: string,
): Promise<ApiSuccessResponse<ReviewsResponse>> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<ReviewsResponse>>(
    `/albums/${deezerId}/reviews?${params}`,
  );
}

export async function apiTrackReviews(
  deezerId: string,
  sort: "recent" | "rating" = "recent",
  cursor?: string,
): Promise<ApiSuccessResponse<ReviewsResponse>> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<ReviewsResponse>>(
    `/tracks/${deezerId}/reviews?${params}`,
  );
}

// Trending (Fase 5 — backend not yet implemented)

export async function apiTrendingAlbums(
  limit = 6,
): Promise<ApiSuccessResponse<{ items: TrendingAlbum[] }>> {
  return apiFetch<ApiSuccessResponse<{ items: TrendingAlbum[] }>>(
    `/trending/albums?limit=${limit}`,
  );
}
