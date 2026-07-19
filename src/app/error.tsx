"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/errors/error-state";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mb-bg px-6">
      <ErrorState
        code="500"
        title={t("serverTitle")}
        description={t("serverDescription")}
        action={{ type: "button", onClick: unstable_retry, label: t("retry") }}
      />
    </div>
  );
}
