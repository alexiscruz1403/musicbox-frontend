import type { TierRank, TierlistTier } from "@/types/api";

// Orden canónico de presentación, espejo de TIER_ORDER del backend. El backend
// ya devuelve los 7 tiers en este orden; la constante existe para el armador,
// que construye el tablero desde cero.
export const TIER_ORDER: TierRank[] = [
  "MASTERPIECE",
  "GREAT",
  "GOOD",
  "MEH",
  "BAD",
  "VERY_BAD",
  "NOT_LISTENED",
];

// Colores de fila del diseño. Son específicos de esta feature (una escala
// propia, no la paleta morada del producto), así que no viven como tokens
// --color-mb-* en globals.css.
export const TIER_COLORS: Record<TierRank, string> = {
  MASTERPIECE: "#FF6B6B",
  GREAT: "#FFA94D",
  GOOD: "#FFD43B",
  MEH: "#A9E34B",
  BAD: "#69DB7C",
  VERY_BAD: "#4EC9B0",
  NOT_LISTENED: "#66D9E8",
};

// Texto sobre las celdas de etiqueta: los 7 colores son claros, así que el
// contraste sale de un tono oscuro fijo, no de --color-mb-text.
export const TIER_LABEL_FG = "#171021";

export interface FlatTierAlbum {
  deezerId: string;
  title: string;
  coverUrl: string | null;
  tier: TierRank;
}

// Aplana los 7 tiers a una sola lista en orden canónico (y por `position`
// dentro de cada tier, que es como ya vienen del backend). Lo usan las cards
// de perfil y de feed para previsualizar sin reconstruir el tablero.
export function flattenTiers(tiers: TierlistTier[]): FlatTierAlbum[] {
  return tiers.flatMap((t) =>
    t.albums.map((a) => ({
      deezerId: a.deezerId,
      title: a.externalAlbumTitle,
      coverUrl: a.externalCoverUrl,
      tier: t.tier,
    })),
  );
}
