"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  apiExportUserData,
  apiForgotPassword,
  apiPatchMe,
  generateIdempotencyKey,
  ApiError,
} from "@/lib/api";
import { DeleteAccountModal } from "./delete-account-modal";
import { ChangeEmailModal } from "./change-email-modal";

interface AccountClientProps {
  email: string;
  handle: string;
  accessToken: string;
  initialIsPrivate: boolean;
}

export default function AccountClient({
  email,
  handle,
  accessToken,
  initialIsPrivate,
}: AccountClientProps) {
  const t = useTranslations("Settings.Account");
  const tCommon = useTranslations("Common");
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, startExportTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isPwPending, startPwTransition] = useTransition();
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [, startPrivacyTransition] = useTransition();
  const router = useRouter();

  function handleSetPrivacy(next: boolean) {
    if (next === isPrivate) return;
    const previous = isPrivate;
    setIsPrivate(next);
    setPrivacyError(null);
    startPrivacyTransition(async () => {
      try {
        await apiPatchMe(accessToken, { isPrivate: next }, generateIdempotencyKey());
      } catch (err) {
        setIsPrivate(previous);
        const apiErr = err as ApiError;
        setPrivacyError(apiErr.message || t("privacyError"));
      }
    });
  }

  function handleChangePassword() {
    setPwError(null);
    startPwTransition(async () => {
      try {
        await apiForgotPassword(email);
        setPwSent(true);
      } catch (err) {
        const apiErr = err as ApiError;
        setPwError(apiErr.message || t("sendEmailError"));
      }
    });
  }

  function handleExport() {
    setExportError(null);
    startExportTransition(async () => {
      try {
        const { data } = await apiExportUserData(accessToken);
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vinlyst-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const apiErr = err as ApiError;
        setExportError(apiErr.message || t("exportError"));
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg">
      <header className="md:hidden sticky top-0 z-10 bg-mb-bg/80 backdrop-blur border-b border-mb-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="text-mb-muted hover:text-mb-text transition-colors cursor-pointer"
          aria-label={tCommon("back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-mb-text">{t("title")}</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 md:py-14">
        <div className="hidden md:block mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors mb-6 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")}
          </button>
          <h1 className="font-serif text-3xl text-mb-text mb-2">{t("title")}</h1>
        </div>

        {/* Email */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-3.5">{t("emailTitle")}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="email"
              value={email}
              readOnly
              disabled
              aria-label={t("emailCurrentLabel")}
              className="flex-1 min-w-0 py-4 px-3.5 sm:py-0 sm:h-12 bg-mb-input border border-mb-border rounded-lg text-mb-muted cursor-not-allowed outline-none"
            />
            <button
              type="button"
              onClick={() => setChangeEmailOpen(true)}
              className="shrink-0 min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors cursor-pointer"
            >
              {t("changeEmail")}
            </button>
          </div>
        </section>

        {/* Password */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-1.5">{t("passwordTitle")}</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-3.5">
            {t("passwordDescription")}
          </p>
          {pwError && (
            <p role="alert" className="text-mb-error text-xs mb-3">
              {pwError}
            </p>
          )}
          {pwSent ? (
            <p role="status" className="text-mb-success text-sm">
              {t("passwordEmailSent", { email })}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isPwPending}
              className="min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPwPending ? t("sending") : t("changePassword")}
            </button>
          )}
        </section>

        {/* Export */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-1.5">{t("exportTitle")}</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-3.5">
            {t("exportDescription")}
          </p>
          {exportError && (
            <p role="alert" className="text-mb-error text-xs mb-3">
              {exportError}
            </p>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? t("preparing") : t("downloadData")}
          </button>
        </section>

        {/* Privacy */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-1.5">{t("privacyTitle")}</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-4">
            {t("privacyDescription")}
          </p>
          {privacyError && (
            <p role="alert" className="text-mb-error text-xs mb-3">
              {privacyError}
            </p>
          )}
          <div role="group" aria-label={t("visibilityLabel")} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSetPrivacy(false)}
              role="radio"
              aria-checked={!isPrivate}
              className={cn(
                "flex items-start gap-3 min-h-11 px-3.5 py-3 rounded-lg border text-left transition-colors cursor-pointer",
                !isPrivate ? "bg-mb-dp border-mb-primary" : "bg-transparent border-mb-border",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  !isPrivate ? "border-mb-accent" : "border-mb-dim",
                )}
              >
                {!isPrivate && <span className="w-2 h-2 rounded-full bg-mb-accent" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-mb-text">{t("publicLabel")}</span>
                <span className="block text-xs text-mb-muted mt-0.5">
                  {t("publicDescription")}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSetPrivacy(true)}
              role="radio"
              aria-checked={isPrivate}
              className={cn(
                "flex items-start gap-3 min-h-11 px-3.5 py-3 rounded-lg border text-left transition-colors cursor-pointer",
                isPrivate ? "bg-mb-dp border-mb-primary" : "bg-transparent border-mb-border",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  isPrivate ? "border-mb-accent" : "border-mb-dim",
                )}
              >
                {isPrivate && <span className="w-2 h-2 rounded-full bg-mb-accent" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-mb-text">{t("privateLabel")}</span>
                <span className="block text-xs text-mb-muted mt-0.5">
                  {t("privateDescription")}
                </span>
              </span>
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="mt-8 p-6 border border-mb-error/40 rounded-xl bg-mb-error/[0.03]">
          <h2 className="text-sm font-semibold text-mb-error mb-1.5">{t("dangerZoneTitle")}</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-4">
            {t("deleteWarning")}
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="min-h-11 px-4.5 border border-mb-error rounded-lg text-mb-error font-semibold text-sm hover:bg-mb-error/10 transition-colors cursor-pointer"
          >
            {t("deleteAccountButton")}
          </button>
        </section>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          accessToken={accessToken}
          handle={handle}
        />
      )}

      {changeEmailOpen && (
        <ChangeEmailModal
          open={changeEmailOpen}
          onClose={() => setChangeEmailOpen(false)}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
