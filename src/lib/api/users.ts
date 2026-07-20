import type {
  ApiSuccessResponse,
  MeResponse,
  PublicProfileResponse,
  HandleCheckResponse,
  AvatarUploadResponse,
  CoverUploadResponse,
  FollowListResponse,
  FollowPendingResult,
  FollowRequestItem,
  FollowRequestsResponse,
  FollowRequestResolution,
} from "@/types/api";
import { apiFetch, type RawListEnvelope } from "./client";

export async function apiGetMe(
  accessToken: string,
): Promise<ApiSuccessResponse<MeResponse>> {
  return apiFetch<ApiSuccessResponse<MeResponse>>("/users/me", { accessToken });
}

export async function apiPatchMe(
  accessToken: string,
  updates: {
    handle?: string;
    displayName?: string;
    bio?: string;
    isPrivate?: boolean;
    language?: "EN" | "ES";
  },
  idempotencyKey: string,
): Promise<ApiSuccessResponse<{ user: MeResponse["user"] }>> {
  return apiFetch<ApiSuccessResponse<{ user: MeResponse["user"] }>>(
    "/users/me",
    {
      method: "PATCH",
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(updates),
    },
  );
}

export async function apiUploadAvatar(
  accessToken: string,
  file: File,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<AvatarUploadResponse>> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ApiSuccessResponse<AvatarUploadResponse>>(
    "/users/me/avatar",
    {
      method: "POST",
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
      body: form,
    },
  );
}

export async function apiUploadCover(
  accessToken: string,
  file: File,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<CoverUploadResponse>> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ApiSuccessResponse<CoverUploadResponse>>(
    "/users/me/cover",
    {
      method: "POST",
      accessToken,
      headers: { "Idempotency-Key": idempotencyKey },
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

export async function apiGetFollowers(
  handle: string,
  cursor?: string,
  limit = 20,
  accessToken?: string,
): Promise<ApiSuccessResponse<FollowListResponse>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<FollowListResponse>>(
    `/users/${handle}/followers?${params}`,
    { accessToken },
  );
}

export async function apiGetFollowing(
  handle: string,
  cursor?: string,
  limit = 20,
  accessToken?: string,
): Promise<ApiSuccessResponse<FollowListResponse>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<FollowListResponse>>(
    `/users/${handle}/following?${params}`,
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

// Target público: 204 (Follow directo, respuesta undefined). Target
// privado: 201 con { status: "PENDING", followRequestId }.
export async function apiFollow(
  handle: string,
  accessToken: string,
): Promise<ApiSuccessResponse<FollowPendingResult> | undefined> {
  return apiFetch<ApiSuccessResponse<FollowPendingResult> | undefined>(
    `/users/${handle}/follow`,
    {
      method: "POST",
      accessToken,
    },
  );
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

// Private profiles — follow requests (post-Fase 7)

export async function apiListFollowRequests(
  accessToken: string,
  cursor?: string,
): Promise<ApiSuccessResponse<FollowRequestsResponse>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  const raw = await apiFetch<RawListEnvelope<FollowRequestItem>>(
    `/users/me/follow-requests${qs ? `?${qs}` : ""}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiRespondFollowRequest(
  accessToken: string,
  id: string,
  status: FollowRequestResolution,
): Promise<void> {
  return apiFetch<void>(`/users/me/follow-requests/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status }),
  });
}
