import type { ReactionType } from "./reviews";

// ─── Tierlists ───────────────────────────────────────────────────────────────

export type TierRank =
  | "MASTERPIECE"
  | "GREAT"
  | "GOOD"
  | "MEH"
  | "BAD"
  | "VERY_BAD"
  | "NOT_LISTENED";

export interface TierlistAlbum {
  id: string;
  albumId: string;
  deezerId: string;
  position: number;
  externalAlbumTitle: string;
  externalCoverUrl: string | null;
}

export interface TierlistTier {
  tier: TierRank;
  albums: TierlistAlbum[];
}

// Shape compartido por GET /tierlists/:id, GET /users/:handle/tierlists y los
// items resourceType: "TIERLIST" del feed — los tres devuelven los 7 tiers
// completos con sus posiciones (ver docs/tierlist-features.md). `user` solo
// viene en el detalle y en el feed; `albumCount` solo en los dos listados.
export interface Tierlist {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  externalArtistName: string;
  externalArtistImageUrl: string | null;
  artist: { deezerId: string };
  user?: {
    id?: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  albumCount?: number;
  tiers: TierlistTier[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: ReactionType | null;
}

// `position` no se envía: la define el orden de aparición dentro de cada tier
// y el servidor la normaliza a 1..N por tier.
export interface TierlistItemInput {
  albumDeezerId: string;
  tier: TierRank;
}

export interface TierlistsResponse {
  items: Tierlist[];
  nextCursor: string | null;
}

// Target de reacciones y comentarios — la superficie social de tierlists es un
// espejo exacto de la de reseñas, solo cambia el prefijo de la ruta.
export type SocialTarget = "reviews" | "tierlists";
