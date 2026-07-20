// ─── Recommendations (Fase 6) ────────────────────────────────────────────────

export type RecommendationReason = "SIMILAR_ARTIST" | "GENRE_MATCH";

export interface RecommendationItem {
  deezerId: string;
  type: "album";
  title: string;
  artistName: string;
  coverUrl: string | null;
  reason: RecommendationReason;
  reasonLabel: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  generatedAt: string;
}
