import type { ApiSuccessResponse, TrendingAlbum, TrendingTrack } from "@/types/api";
import { apiFetch } from "./client";

// Trending (Fase 5)
//
// A diferencia de todos los demás listados del cliente API, que son paginados
// y devuelven { data: Row[], meta: { cursor } } normalizado a { items,
// nextCursor }, estos dos endpoints NO son paginados — son un top-N fijo
// (limit, sin cursor) y responden { data: T[] } directamente. Sin capa de
// normalización: los consumidores leen result.data (ya es el array).

export async function apiTrendingAlbums(
  limit = 20,
): Promise<ApiSuccessResponse<TrendingAlbum[]>> {
  return apiFetch<ApiSuccessResponse<TrendingAlbum[]>>(
    `/trending/albums?limit=${limit}`,
  );
}

export async function apiTrendingTracks(
  limit = 20,
): Promise<ApiSuccessResponse<TrendingTrack[]>> {
  return apiFetch<ApiSuccessResponse<TrendingTrack[]>>(
    `/trending/tracks?limit=${limit}`,
  );
}
