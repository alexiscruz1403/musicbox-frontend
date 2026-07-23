import type {
  ApiSuccessResponse,
  CatalogAlbum,
  CatalogTrack,
  CatalogPage,
  CatalogSearchResult,
  CatalogSearchType,
  CatalogResourceType,
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

const VIEW_SEGMENT: Record<CatalogResourceType, string> = {
  ALBUM: "albums",
  TRACK: "tracks",
  ARTIST: "artists",
};

// Registra explícitamente una visita real (POST). Reemplaza el registro que el
// backend hacía como efecto secundario del GET de detalle — ese GET ahora es
// de solo lectura, así que el prefetch de Next y generateMetadata dejan de
// contar como vistas. Ver docs/musicbox-frontend-guide.md y el contrato backend.
export async function apiCatalogRecordView(
  resourceType: CatalogResourceType,
  deezerId: string,
  accessToken: string,
): Promise<void> {
  return apiFetch<void>(`/catalog/${VIEW_SEGMENT[resourceType]}/${deezerId}/view`, {
    method: "POST",
    accessToken,
  });
}

// Devuelve el detalle extendido del artista (info básica + top-reviewed +
// trending). Endpoint público: antes existía un `/artists/:id/detail` separado
// para los rankings; el backend lo consolidó en este endpoint base y eliminó
// el `/detail` (ver docs/fase-2-features.md §GET /v1/catalog/artists/:deezerId).
export async function apiCatalogArtist(
  deezerId: string,
): Promise<ApiSuccessResponse<ArtistDetail>> {
  return apiFetch<ApiSuccessResponse<ArtistDetail>>(
    `/catalog/artists/${deezerId}`,
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
