import { apiRemoveReaction, apiSetReaction, generateIdempotencyKey } from "@/lib/api";
import type { ReactionType, SocialTarget } from "@/types/api";

// The backend reaction endpoint isn't a toggle: POST upserts (never removes),
// removal is a separate DELETE. This maps a click on `clicked` given the
// `current` reaction into the right call, returning the new reaction state.
export async function sendReaction(
  accessToken: string,
  targetId: string,
  current: ReactionType | null,
  clicked: ReactionType,
  target: SocialTarget = "reviews",
): Promise<ReactionType | null> {
  if (current === clicked) {
    await apiRemoveReaction(accessToken, targetId, target);
    return null;
  }
  await apiSetReaction(accessToken, targetId, clicked, generateIdempotencyKey(), target);
  return clicked;
}
