import type {
  ApiSuccessResponse,
  Tierlist,
  TierlistItemInput,
  TierlistsResponse,
} from "@/types/api";
import { apiFetch, type RawListEnvelope } from "./client";

// Tierlists — CRUD. Reacciones y comentarios sobre tierlists viven en
// `social.ts`, que ya expone las mismas funciones parametrizadas por target
// (las rutas son un espejo exacto de las de reseñas).

export async function apiTierlist(
  id: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<Tierlist>> {
  return apiFetch<ApiSuccessResponse<Tierlist>>(`/tierlists/${id}`, {
    accessToken,
  });
}

export async function apiUserTierlists(
  handle: string,
  cursor?: string,
  accessToken?: string,
  limit = 10,
): Promise<ApiSuccessResponse<TierlistsResponse>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<Tierlist>>(
    `/users/${handle}/tierlists?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiCreateTierlist(
  accessToken: string,
  artistDeezerId: string,
  items: TierlistItemInput[],
  idempotencyKey: string,
): Promise<ApiSuccessResponse<Tierlist>> {
  return apiFetch<ApiSuccessResponse<Tierlist>>("/tierlists", {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ artistDeezerId, items }),
  });
}

export async function apiUpdateTierlist(
  accessToken: string,
  id: string,
  items: TierlistItemInput[],
  idempotencyKey: string,
): Promise<ApiSuccessResponse<Tierlist>> {
  return apiFetch<ApiSuccessResponse<Tierlist>>(`/tierlists/${id}`, {
    method: "PATCH",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ items }),
  });
}

export async function apiDeleteTierlist(
  accessToken: string,
  id: string,
  idempotencyKey: string,
): Promise<void> {
  return apiFetch<void>(`/tierlists/${id}`, {
    method: "DELETE",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}
