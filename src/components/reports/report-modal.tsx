"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiCreateReport, generateIdempotencyKey, ApiError } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import type { ReportTargetType } from "@/types/api";

const REASON_MAX = 500;

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
  targetType: ReportTargetType;
  targetId: string;
  previewTitle: string;
  previewSubtitle?: string;
}

export function ReportModal({
  open,
  onClose,
  accessToken,
  targetType,
  targetId,
  previewTitle,
  previewSubtitle,
}: ReportModalProps) {
  const t = useTranslations("Report");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Lazy-initialized once per mount. Callers mount this component only while
  // `open` is true, so a fresh key/blank form is guaranteed on every open.
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const canSubmit = reason.trim().length > 0 && !isPending && !success;

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await apiCreateReport(
          accessToken,
          { targetType, targetId, reason: reason.trim() },
          idempotencyKey,
        );
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.statusCode === 429) {
          setError(t("rateLimitError"));
        } else if (apiErr.code === "REPORT_TARGET_NOT_FOUND") {
          setError(t("targetNotFoundError"));
        } else {
          setError(apiErr.message || t("genericError"));
        }
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("title")}
      panelClassName="w-full sm:max-w-[460px] max-h-[90vh] overflow-y-auto bg-mb-card border border-mb-border rounded-t-2xl sm:rounded-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
    >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-serif text-xl text-mb-text">{t("title")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAriaLabel")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-mb-muted hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-mb-muted mb-4.5">
          {t("anonymousNote")}
        </p>

        <div className="bg-mb-input border border-mb-border rounded-lg p-3.5 mb-5">
          <span className="block text-[11px] tracking-wide uppercase text-mb-dim font-semibold mb-1.5">
            {t("reportingLabel")}
          </span>
          <p className="text-sm text-mb-text leading-relaxed">{previewTitle}</p>
          {previewSubtitle && (
            <p className="text-xs text-mb-muted mt-1">{previewSubtitle}</p>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="reportReason" className="text-sm font-semibold text-mb-muted">
              {t("detailsLabel")}
            </label>
            <span
              className={cn(
                "text-xs tabular-nums",
                reason.length > REASON_MAX * 0.9 ? "text-mb-error" : "text-mb-dim",
              )}
            >
              {t("charCount", { count: reason.length, max: REASON_MAX })}
            </span>
          </div>
          <textarea
            id="reportReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REASON_MAX}
            rows={4}
            placeholder={t("placeholder")}
            className="w-full min-h-[90px] p-3 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-y text-sm leading-relaxed"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 bg-mb-success/10 border border-mb-success rounded-lg px-4 py-3 text-mb-success text-sm"
          >
            {t("successMessage")}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-5 rounded-lg text-mb-muted font-medium text-sm hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "min-h-11 px-5 rounded-lg font-semibold text-sm transition-colors",
              !canSubmit
                ? "bg-mb-border text-mb-dim cursor-not-allowed"
                : "bg-mb-primary hover:bg-mb-primary-h text-white cursor-pointer",
            )}
          >
            {isPending ? t("sending") : success ? t("successMessage") : t("submit")}
          </button>
        </div>
    </Modal>
  );
}
