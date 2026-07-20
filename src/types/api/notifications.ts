// ─── Notifications (Fase 5) ──────────────────────────────────────────────────

export type NotificationType =
  | "LIKE"
  | "DISLIKE"
  | "COMMENT"
  | "FOLLOW"
  | "MODERATION"
  | "FOLLOW_REQUEST"
  | "FOLLOW_REQUEST_ACCEPTED";

export interface NotificationActor {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationReviewRef {
  id: string;
  externalTitle: string;
  externalArtistName: string;
  externalCoverUrl: string | null;
}

export interface NotificationRow {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  reviewId: string | null;
  commentId: string | null;
  actorCount: number | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  review: NotificationReviewRef | null;
}

export interface NotificationsResponse {
  items: NotificationRow[];
  nextCursor: string | null;
}
