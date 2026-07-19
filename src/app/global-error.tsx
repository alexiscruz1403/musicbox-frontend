"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/errors/error-state";
import "./globals.css";

// This boundary replaces the entire app tree, including the root layout's
// NextIntlClientProvider — there's no intl context available here, so this
// tiny local dictionary reads the locale cookie directly instead of using
// useTranslations/next-intl.
const COPY = {
  en: {
    title: "Something broke on our end",
    description: "We're aware and already looking into it.",
    retry: "Retry",
  },
  es: {
    title: "Algo falló de nuestra parte",
    description: "Estamos al tanto y ya lo estamos mirando.",
    retry: "Reintentar",
  },
} as const;

function readLocale(): keyof typeof COPY {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )mb_locale=([^;]*)/);
  return match?.[1] === "es" ? "es" : "en";
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = readLocale();
  const t = COPY[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="min-h-full bg-mb-bg text-mb-text antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <ErrorState
            code="500"
            title={t.title}
            description={t.description}
            action={{ type: "button", onClick: unstable_retry, label: t.retry }}
          />
        </div>
      </body>
    </html>
  );
}
