import type { ApiSuccessResponse, RecommendationsResponse } from "@/types/api";
import { apiFetch } from "./client";

// Recommendations (Fase 6)
//
// 204 → null: GET /recommendations responde 204 sin body cuando el usuario
// tiene menos de 3 reseñas activas. apiFetch ya retorna undefined en
// cualquier 204/2xx-sin-body; acá solo se convierte a null para que el
// componente distinga "sin datos" de un array vacío.
export async function apiGetRecommendations(
  accessToken: string,
): Promise<ApiSuccessResponse<RecommendationsResponse> | null> {
  const result = await apiFetch<ApiSuccessResponse<RecommendationsResponse> | undefined>(
    "/recommendations",
    { accessToken },
  );
  return result ?? null;
}
