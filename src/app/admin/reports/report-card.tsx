"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/review-format";
import type { AdminReportRow, ReportStatus } from "@/types/api";

interface ReportCardProps {
  report: AdminReportRow;
  onDismiss: () => void;
  onAccept: () => void;
}

function ReportedContentBox({ report }: { report: AdminReportRow }) {
  const t = useTranslations("Admin.reports.card");
  const content = report.reportedContent;

  if (!content) {
    return (
      <p className="text-sm text-mb-dim italic">{t("contentUnavailable")}</p>
    );
  }

  if ("handle" in content) {
    return (
      <p className="text-sm text-mb-text">
        {t("userLabel")} <span className="font-mono text-mb-accent">@{content.handle}</span>
      </p>
    );
  }

  if ("content" in content) {
    return <p className="text-sm text-mb-text leading-relaxed">{content.content}</p>;
  }

  // Review (TRACK or ALBUM)
  return (
    <div>
      <p className="text-sm text-mb-text leading-relaxed">{content.description}</p>
      {content.reviewType === "ALBUM" && content.trackDescriptions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-mb-border flex flex-col gap-2.5">
          <span className="block text-[11px] tracking-wide uppercase text-mb-dim font-semibold">
            {t("albumTrackReviewsLabel")}
          </span>
          {content.trackDescriptions.map((t, i) => (
            <div key={i}>
              <span className="block text-[13px] font-semibold text-mb-text mb-0.5">
                {t.trackTitle}
              </span>
              {t.description && (
                <p className="text-[13px] text-mb-muted leading-relaxed">{t.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportCard({ report, onDismiss, onAccept }: ReportCardProps) {
  const t = useTranslations("Admin.reports.card");

  const typeMetaMap: Record<AdminReportRow["targetType"], { label: string; className: string }> = {
    REVIEW: { label: t("typeReview"), className: "text-mb-accent bg-mb-dp border-mb-ddp" },
    COMMENT: { label: t("typeComment"), className: "text-mb-muted bg-mb-input border-mb-border" },
    USER: { label: t("typeUser"), className: "text-mb-primary-h bg-mb-dp border-mb-ddp" },
  };

  const statusMetaMap: Record<ReportStatus, { label: string; className: string }> = {
    PENDING: { label: t("statusPending"), className: "text-yellow-300 bg-yellow-300/10" },
    REVIEWED: { label: t("statusReviewed"), className: "text-mb-success bg-mb-success/10" },
    DISMISSED: { label: t("statusDismissed"), className: "text-mb-dim bg-mb-border/40" },
  };

  const typeMeta = typeMetaMap[report.targetType];
  const statusMeta = statusMetaMap[report.status];

  return (
    <article className="bg-mb-card border border-mb-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3.5 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide",
              typeMeta.className,
            )}
          >
            {typeMeta.label}
          </span>
          <span className="font-mono text-xs text-mb-dim">#{report.id.slice(0, 8)}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
            statusMeta.className,
          )}
        >
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />
          {statusMeta.label}
        </span>
      </div>

      <div className="mb-3">
        <span className="block text-[11px] tracking-wide uppercase text-mb-dim font-semibold mb-1">
          {t("detailLabel")}
        </span>
        <p className="text-sm text-mb-text leading-relaxed">{report.reason}</p>
      </div>

      <div className="bg-mb-input border border-mb-border rounded-lg p-3.5 mb-3.5">
        <span className="block text-[11px] tracking-wide uppercase text-mb-dim font-semibold mb-1.5">
          {t("reportedContentLabel")}
        </span>
        <ReportedContentBox report={report} />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs text-mb-dim">
          {t("reportedByPrefix")} <span className="font-mono text-mb-muted">@{report.reporter.handle}</span>{" "}
          · {timeAgo(report.createdAt)}
        </span>
        {report.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-10 px-4 border border-mb-border rounded-lg text-mb-muted font-medium text-[13px] hover:border-mb-dim hover:text-mb-text transition-colors cursor-pointer"
            >
              {t("dismissButton")}
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="min-h-10 px-4 border border-mb-error rounded-lg text-mb-error font-semibold text-[13px] hover:bg-mb-error/10 transition-colors cursor-pointer"
            >
              {t("acceptButton")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
