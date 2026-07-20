import type {
  ApiSuccessResponse,
  CatalogAlbum,
  CatalogTrack,
  CatalogArtist,
  CatalogPage,
  CatalogSearchResult,
  CatalogSearchType,
  CatalogQuickSearchItem,
  CatalogSearchHistoryItem,
  RecentlyViewedItem,
  RecentlyViewedDetailItem,
  ArtistDetail,
  ArtistTrackItem,
} from "@/types/api";
import { apiFetch } from "./client";

export async function apiCatalogSearch(
  q: string,
  type: CatalogSearchType,
  limit = 20,
  cursor?: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<CatalogPage<CatalogSearchResult>>> {
  const params = new URLSearchParams({ q, type, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<CatalogPage<CatalogSearchResult>>>(
    `/catalog/search?${params}`,
    { accessToken },
  );
}

export async function apiCatalogQuickSearch(
  q: string,
): Promise<ApiSuccessResponse<CatalogQuickSearchItem[]>> {
  return apiFetch<ApiSuccessResponse<CatalogQuickSearchItem[]>>(
    `/catalog/quick-search?q=${encodeURIComponent(q)}`,
  );
}

export async function apiCatalogSearchHistory(
  accessToken: string,
): Promise<ApiSuccessResponse<CatalogSearchHistoryItem[]>> {
  return apiFetch<ApiSuccessResponse<CatalogSearchHistoryItem[]>>(
    "/catalog/search-history",
    { accessToken },
  );
}

export async function apiDeleteCatalogSearchHistoryItem(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch<void>(`/catalog/search-history/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function apiDeleteCatalogSearchHistory(
  accessToken: string,
): Promise<void> {
  return apiFetch<void>("/catalog/search-history", {
    method: "DELETE",
    accessToken,
  });
}

export async function apiCatalogRecentlyViewed(
  accessToken: string,
): Promise<ApiSuccessResponse<RecentlyViewedItem[]>> {
  return apiFetch<ApiSuccessResponse<RecentlyViewedItem[]>>(
    "/catalog/recently-viewed",
    { accessToken },
  );
}

// Bundle de detalle completo (≤10 recursos) para prefetch offline — Fase 8.
// No vuelve a registrar la visita (mismo orden que /recently-viewed).
export async function apiCatalogRecentlyViewedDetails(
  accessToken: string,
): Promise<ApiSuccessResponse<RecentlyViewedDetailItem[]>> {
  return apiFetch<ApiSuccessResponse<RecentlyViewedDetailItem[]>>(
    "/catalog/recently-viewed/details",
    { accessToken },
  );
}

export async function apiCatalogAlbum(
  deezerId: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<CatalogAlbum>> {
  return apiFetch<ApiSuccessResponse<CatalogAlbum>>(
    `/catalog/albums/${deezerId}`,
    { accessToken },
  );
}

export async function apiCatalogTrack(
  deezerId: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<CatalogTrack>> {
  return apiFetch<ApiSuccessResponse<CatalogTrack>>(
    `/catalog/tracks/${deezerId}`,
    { accessToken },
  );
}

export async function apiCatalogArtist(
  deezerId: string,
  accessToken?: string,
): Promise<ApiSuccessResponse<CatalogArtist>> {
  return apiFetch<ApiSuccessResponse<CatalogArtist>>(
    `/catalog/artists/${deezerId}`,
    { accessToken },
  );
}

export async function apiCatalogArtistDetail(
  deezerId: string,
): Promise<ApiSuccessResponse<ArtistDetail>> {
  return apiFetch<ApiSuccessResponse<ArtistDetail>>(
    `/catalog/artists/${deezerId}/detail`,
  );
}

export async function apiCatalogArtistAlbums(
  deezerId: string,
  limit = 20,
  cursor?: string,
): Promise<ApiSuccessResponse<CatalogPage<CatalogAlbum>>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<CatalogPage<CatalogAlbum>>>(
    `/catalog/artists/${deezerId}/albums?${params}`,
  );
}

export async function apiCatalogArtistTracks(
  deezerId: string,
  limit = 20,
  cursor?: string,
): Promise<ApiSuccessResponse<CatalogPage<ArtistTrackItem>>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ApiSuccessResponse<CatalogPage<ArtistTrackItem>>>(
    `/catalog/artists/${deezerId}/tracks?${params}`,
  );
}
