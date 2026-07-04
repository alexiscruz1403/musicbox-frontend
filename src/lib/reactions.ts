import { apiRemoveReaction, apiSetReaction, generateIdempotencyKey } from "@/lib/api";
import type { ReactionType } from "@/types/api";

// The backend reaction endpoint isn't a toggle: POST upserts (never removes),
// removal is a separate DELETE. This maps a click on `clicked` given the
// `current` reaction into the right call, returning the new reaction state.
export async function sendReaction(
  accessToken: string,
  reviewId: string,
  current: ReactionType | null,
  clicked: ReactionType,
): Promise<ReactionType | null> {
  if (current === clicked) {
    await apiRemoveReaction(accessToken, reviewId);
    return null;
  }
  await apiSetReaction(accessToken, reviewId, clicked, generateIdempotencyKey());
  return clicked;
}
