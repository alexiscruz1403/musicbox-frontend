import type { NotificationRow } from "@/types/api";

function targetClause(row: NotificationRow): string {
  return row.review ? ` de ${row.review.externalTitle}` : " tu reseña";
}

export function getNotificationText(row: NotificationRow): string {
  const grouped = row.actorCount != null && row.actorCount >= 2;
  const others = grouped ? row.actorCount! - 1 : 0;
  const target = targetClause(row);

  switch (row.type) {
    case "LIKE":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más le dieron like a tu reseña${target}`
        : `le gustó tu reseña${target}`;
    case "DISLIKE":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más reaccionaron a tu reseña${target}`
        : `no le gustó tu reseña${target}`;
    case "COMMENT":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más comentaron en tu reseña${target}`
        : `comentó en tu reseña${target}`;
    case "FOLLOW":
      return grouped
        ? `y ${others} persona${others === 1 ? "" : "s"} más empezaron a seguirte`
        : "empezó a seguirte";
    case "MODERATION":
      return row.reviewId
        ? "Tu reseña fue ocultada por moderación."
        : "Tu contenido fue ocultado por moderación.";
  }
}

export function notificationHref(row: NotificationRow): string {
  if (row.type === "FOLLOW" && row.actor) return `/u/${row.actor.handle}`;
  if (row.review) return `/reviews/${row.review.id}`;
  if (row.actor) return `/u/${row.actor.handle}`;
  return "/feed";
}
