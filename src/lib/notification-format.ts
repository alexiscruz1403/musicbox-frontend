import { useTranslations } from "next-intl";
import type { NotificationRow } from "@/types/api";

export function useNotificationText(row: NotificationRow): string {
  const t = useTranslations("Notifications");
  const grouped = row.actorCount != null && row.actorCount >= 2;
  const others = grouped ? row.actorCount! - 1 : 0;
  const target = row.review
    ? t("targetReview", { title: row.review.externalTitle })
    : t("targetFallback");

  switch (row.type) {
    case "LIKE":
      return grouped ? t("likeGrouped", { others, target }) : t("likeSingle", { target });
    case "DISLIKE":
      return grouped ? t("dislikeGrouped", { others, target }) : t("dislikeSingle", { target });
    case "COMMENT":
      return grouped ? t("commentGrouped", { others, target }) : t("commentSingle", { target });
    case "FOLLOW":
      return grouped ? t("followGrouped", { others }) : t("followSingle");
    case "MODERATION":
      return row.reviewId ? t("moderationReview") : t("moderationContent");
    case "FOLLOW_REQUEST":
      return t("followRequest");
    case "FOLLOW_REQUEST_ACCEPTED":
      return t("followRequestAccepted");
  }
}

export function notificationHref(row: NotificationRow): string {
  if (row.type === "FOLLOW" && row.actor) return `/u/${row.actor.handle}`;
  if (row.type === "FOLLOW_REQUEST" && row.actor) return `/u/${row.actor.handle}`;
  if (row.type === "FOLLOW_REQUEST_ACCEPTED" && row.actor) return `/u/${row.actor.handle}`;
  if (row.review) return `/reviews/${row.review.id}`;
  if (row.actor) return `/u/${row.actor.handle}`;
  return "/feed";
}
