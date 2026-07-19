"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiConfirmChangeEmail, type ApiError } from "@/lib/api";

type Status = "loading" | "success" | "error";

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  INVALID_CHANGE_EMAIL_TOKEN: "errorInvalidToken",
  OAUTH_ACCOUNT_EMAIL_LOCKED: "errorOauthLocked",
  EMAIL_TAKEN: "errorEmailTaken",
};

export function ConfirmChangeEmailClient() {
  const t = useTranslations("Auth.ConfirmChangeEmail");
  const tCommon = useTranslations("Common");
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const linkMissing = !userId || !token;
  const [status, setStatus] = useState<Status>(linkMissing ? "error" : "loading");
  const [errorMessage, setErrorMessage] = useState(t("linkInvalidDefault"));

  useEffect(() => {
    if (!userId || !token) return;

    let cancelled = false;
    (async () => {
      try {
        await apiConfirmChangeEmail(userId, token);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        const mappedKey = ERROR_MESSAGE_KEYS[apiErr.code];
        setErrorMessage(
          (mappedKey ? t(mappedKey) : undefined) ||
            apiErr.message ||
            tCommon("genericError"),
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  return (
    <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 text-center space-y-4">
      {status === "loading" && (
        <>
          <svg
            className="w-11 h-11 mx-auto animate-spin text-mb-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <h1 className="font-serif text-2xl text-mb-text">{t("loadingHeading")}</h1>
          <p role="status" className="text-sm text-mb-muted">{t("loadingSubtitle")}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 mx-auto rounded-full bg-mb-success/10 border border-mb-success/40 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-mb-success" />
          </div>
          <h1 className="font-serif text-2xl text-mb-text">{t("successHeading")}</h1>
          <p role="status" className="text-sm text-mb-muted leading-relaxed">
            {t("successMessage")}
          </p>
          <Link
            href="/login"
            className="inline-flex w-full min-h-11 items-center justify-center bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors"
          >
            {tCommon("signIn")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 mx-auto rounded-full bg-mb-error/10 border border-mb-error/40 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-mb-error" />
          </div>
          <h1 className="font-serif text-2xl text-mb-text">{t("errorHeading")}</h1>
          <p role="alert" className="text-sm text-mb-muted leading-relaxed">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="inline-flex w-full min-h-11 items-center justify-center bg-transparent border border-mb-border rounded-xl text-mb-muted hover:text-mb-text hover:bg-mb-input font-medium transition-colors"
          >
            {tCommon("backToLogin")}
          </Link>
        </>
      )}
    </div>
  );
}
