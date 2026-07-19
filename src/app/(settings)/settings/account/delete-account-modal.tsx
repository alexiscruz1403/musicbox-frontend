"use client";

import { useEffect, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiDeleteMe, ApiError } from "@/lib/api";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
  handle: string;
}

export function DeleteAccountModal({
  open,
  onClose,
  accessToken,
  handle,
}: DeleteAccountModalProps) {
  const t = useTranslations("Settings.Account");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const match = confirmText.trim() === `@${handle}`;

  function handleDelete() {
    if (!match || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await apiDeleteMe(accessToken);
        await signOut({ callbackUrl: "/login" });
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || t("deleteAccountError"));
      }
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("deleteConfirmModalLabel")}
        className="w-full sm:max-w-[400px] bg-mb-card border border-mb-border rounded-t-2xl sm:rounded-xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      >
        <h3 className="font-serif text-xl text-mb-text mb-3 leading-tight">
          {t("deleteConfirmHeading")}
        </h3>
        <p className="text-sm text-mb-muted leading-relaxed mb-5">
          {t("deleteAnonymizeText")}{" "}
          <span className="text-mb-dim">{t("deletedUserLabel")}</span>.
        </p>

        <label htmlFor="mbConfirmDelete" className="block text-sm font-medium text-mb-muted mb-2">
          {t("typeToConfirmPrefix")} <span className="font-mono text-mb-accent">@{handle}</span> {t("typeToConfirmSuffix")}
        </label>
        <input
          id="mbConfirmDelete"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={`@${handle}`}
          autoComplete="off"
          className={cn(
            "w-full h-12 px-3.5 bg-mb-input border rounded-lg text-mb-text font-mono text-sm outline-none transition-colors mb-5",
            confirmText.length > 0 && !match
              ? "border-mb-error"
              : "border-mb-border focus:border-mb-primary",
          )}
        />

        {error && (
          <div
            role="alert"
            className="mb-5 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {error}
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
            onClick={handleDelete}
            disabled={!match || isPending}
            className={cn(
              "min-h-11 px-5 rounded-lg font-semibold text-sm transition-colors",
              !match || isPending
                ? "bg-transparent border border-mb-border text-mb-dim cursor-not-allowed"
                : "bg-mb-error text-mb-bg hover:bg-mb-error/90 cursor-pointer",
            )}
          >
            {isPending ? t("deleting") : t("deletePermanently")}
          </button>
        </div>
      </div>
    </div>
  );
}
