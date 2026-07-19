"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiAdminListReports, apiAdminUpdateReportStatus } from "@/lib/api";
import { ReportCard } from "./report-card";
import type { AdminReportRow, ReportStatus, ReportTargetType } from "@/types/api";

interface ConfirmState {
  report: AdminReportRow;
  action: "REVIEWED" | "DISMISSED";
}

interface AdminReportsClientProps {
  accessToken: string;
}

export default function AdminReportsClient({ accessToken }: AdminReportsClientProps) {
  const t = useTranslations("Admin.reports");
  const STATUS_TABS: { id: ReportStatus | undefined; label: string }[] = [
    { id: "PENDING", label: t("statusPending") },
    { id: "REVIEWED", label: t("statusReviewed") },
    { id: "DISMISSED", label: t("statusDismissed") },
    { id: undefined, label: t("statusAll") },
  ];
  const TYPE_TABS: { id: ReportTargetType | undefined; label: string }[] = [
    { id: undefined, label: t("typeAll") },
    { id: "REVIEW", label: t("typeReview") },
    { id: "COMMENT", label: t("typeComment") },
    { id: "USER", label: t("typeUser") },
  ];
  const [status, setStatus] = useState<ReportStatus | undefined>("PENDING");
  const [targetType, setTargetType] = useState<ReportTargetType | undefined>(undefined);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["admin-reports", status ?? "ALL", targetType ?? "ALL"],
    queryFn: ({ pageParam }) =>
      apiAdminListReports(accessToken, {
        status,
        targetType,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 10 * 1000,
  });

  const items = (pages?.pages ?? []).flatMap((p) => p.data.items);
  const isLoading = isFetching && items.length === 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleConfirm() {
    if (!confirmState) return;
    const { report, action } = confirmState;
    startTransition(async () => {
      try {
        await apiAdminUpdateReportStatus(accessToken, report.id, action);
        void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      } finally {
        setConfirmState(null);
      }
    });
  }

  const isAccept = confirmState?.action === "REVIEWED";

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-9 pb-24">
      <h1 className="font-serif text-[28px] text-mb-text mb-1.5">{t("heading")}</h1>
      <p className="text-sm text-mb-muted mb-7">
        {t("subtitle")}
      </p>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex gap-1 border-b border-mb-border overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setStatus(t.id)}
              className={cn(
                "shrink-0 min-h-11 px-4 -mb-px border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer",
                status === t.id
                  ? "border-mb-primary text-mb-text font-semibold"
                  : "border-transparent text-mb-muted font-medium hover:text-mb-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTargetType(t.id)}
              className={cn(
                "min-h-9 px-3 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                targetType === t.id
                  ? "bg-mb-dp border-mb-ddp text-mb-accent"
                  : "bg-transparent border-mb-border text-mb-muted hover:text-mb-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-40 bg-mb-card border border-mb-border rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-mb-card border border-mb-border rounded-xl">
          <p className="text-[15px] text-mb-muted">{t("emptyState")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            {items.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onDismiss={() => setConfirmState({ report: r, action: "DISMISSED" })}
                onAccept={() => setConfirmState({ report: r, action: "REVIEWED" })}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
            {isFetchingNextPage && (
              <div
                className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
                aria-label={t("loadingMoreAriaLabel")}
              />
            )}
          </div>
        </>
      )}

      {confirmState && (
        <div
          onClick={() => setConfirmState(null)}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={t("confirmAriaLabel")}
            className="w-full max-w-[420px] bg-mb-card border border-mb-border rounded-xl p-6.5 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          >
            <h3 className="font-serif text-[19px] text-mb-text mb-3.5">
              {isAccept ? t("confirmAcceptHeading") : t("confirmDismissHeading")}
            </h3>
            <p className="text-sm text-mb-muted leading-relaxed mb-6">
              {isAccept ? t("confirmAcceptBody") : t("confirmDismissBody")}{" "}
              {t("confirmCriticalPrefix")} <strong className="text-mb-text">{t("confirmCriticalBold")}</strong>.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={isPending}
                className="min-h-11 px-5 rounded-lg text-mb-muted font-medium text-sm hover:bg-mb-input hover:text-mb-text transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={cn(
                  "min-h-11 px-5 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed",
                  isAccept ? "bg-mb-error hover:bg-mb-error/90" : "bg-mb-primary hover:bg-mb-primary-h",
                )}
              >
                {isPending ? t("processing") : isAccept ? t("confirmAcceptButton") : t("confirmDismissButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
