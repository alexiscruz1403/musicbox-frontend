"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiChangeEmail, ApiError } from "@/lib/api";

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  SAME_EMAIL: "errorSameEmail",
  EMAIL_TAKEN: "errorEmailTaken",
  USER_NOT_FOUND: "errorUserNotFound",
  OAUTH_ACCOUNT_EMAIL_LOCKED: "errorOauthLocked",
};

export function ChangeEmailModal({ open, onClose, accessToken }: ChangeEmailModalProps) {
  const t = useTranslations("Settings.Account");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
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

  function handleClose() {
    setNewEmail("");
    setError(null);
    setSent(false);
    onClose();
  }

  function handleSubmit() {
    if (isPending) return;
    if (!EMAIL_REGEX.test(newEmail.trim())) {
      setError(t("emailInvalid"));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await apiChangeEmail(accessToken, newEmail.trim());
        setSent(true);
      } catch (err) {
        const apiErr = err as ApiError;
        const mappedKey = ERROR_MESSAGE_KEYS[apiErr.code];
        setError(
          (mappedKey ? t(mappedKey) : undefined) || apiErr.message || t("changeEmailError"),
        );
      }
    });
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("changeEmail")}
        className="w-full sm:max-w-[400px] bg-mb-card border border-mb-border rounded-t-2xl sm:rounded-xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      >
        {!sent ? (
          <>
            <h3 className="font-serif text-xl text-mb-text mb-3 leading-tight">
              {t("changeEmailHeading")}
            </h3>
            <p className="text-sm text-mb-muted leading-relaxed mb-5">
              {t("changeEmailDescription")}
            </p>

            <label htmlFor="mbNewEmail" className="block text-sm font-medium text-mb-muted mb-2">
              {t("newEmailLabel")}
            </label>
            <input
              id="mbNewEmail"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError(null);
              }}
              placeholder={t("newEmailPlaceholder")}
              autoComplete="email"
              disabled={isPending}
              className={cn(
                "w-full h-12 px-3.5 bg-mb-input border rounded-lg text-mb-text text-sm outline-none transition-colors mb-5",
                error ? "border-mb-error" : "border-mb-border focus:border-mb-primary",
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
                onClick={handleClose}
                className="min-h-11 px-5 rounded-lg text-mb-muted font-medium text-sm hover:bg-mb-input hover:text-mb-text transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || newEmail.trim().length === 0}
                className={cn(
                  "min-h-11 px-5 rounded-lg font-semibold text-sm transition-colors",
                  isPending || newEmail.trim().length === 0
                    ? "bg-transparent border border-mb-border text-mb-dim cursor-not-allowed"
                    : "bg-mb-primary hover:bg-mb-primary-h text-white cursor-pointer",
                )}
              >
                {isPending ? t("sending") : t("sendConfirmationLink")}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-mb-success/10 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-mb-text leading-relaxed mb-6">
              {t("confirmationSentPrefix")}{" "}
              <span className="font-mono text-mb-accent">{newEmail.trim()}</span>
              {t("confirmationSentSuffix")}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-11 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {t("close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
