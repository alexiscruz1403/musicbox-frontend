// ─── Moderation (Fase 7) ───────────────────────────────────────────────────

export type ReportTargetType = "REVIEW" | "COMMENT" | "USER";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export interface ReportedContentReviewTrack {
  reviewType: "TRACK";
  description: string;
}

export interface ReportedContentReviewAlbum {
  reviewType: "ALBUM";
  description: string;
  trackDescriptions: { trackTitle: string; description: string | null }[];
}

export interface ReportedContentComment {
  content: string;
}

export interface ReportedContentUser {
  handle: string;
}

export type ReportedContent =
  | ReportedContentReviewTrack
  | ReportedContentReviewAlbum
  | ReportedContentComment
  | ReportedContentUser
  | null;

export interface AdminReportRow {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; handle: string; displayName: string };
  reportedContent: ReportedContent;
}

export interface AdminReportsResponse {
  items: AdminReportRow[];
  nextCursor: string | null;
}

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}

export interface CreatedReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: "PENDING";
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// Opaque envelope — the export button only serializes and downloads it.
export type ExportDataResponse = Record<string, unknown>;
