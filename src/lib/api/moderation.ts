import type {
  ApiSuccessResponse,
  ReportTargetType,
  ReportStatus,
  AdminReportRow,
  AdminReportsResponse,
  CreateReportDto,
  CreatedReport,
} from "@/types/api";
import { apiFetch, type RawListEnvelope } from "./client";

// Moderation (Fase 7)

export async function apiCreateReport(
  accessToken: string,
  payload: CreateReportDto,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<CreatedReport>> {
  return apiFetch<ApiSuccessResponse<CreatedReport>>("/reports", {
    method: "POST",
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function apiAdminListReports(
  accessToken: string,
  options: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ApiSuccessResponse<AdminReportsResponse>> {
  const { status, targetType, cursor, limit = 20 } = options;
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set("status", status);
  if (targetType) params.set("targetType", targetType);
  if (cursor) params.set("cursor", cursor);
  const raw = await apiFetch<RawListEnvelope<AdminReportRow>>(
    `/admin/reports?${params}`,
    { accessToken },
  );
  return { data: { items: raw.data, nextCursor: raw.meta.cursor } };
}

export async function apiAdminUpdateReportStatus(
  accessToken: string,
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
): Promise<void> {
  return apiFetch<void>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status }),
  });
}
