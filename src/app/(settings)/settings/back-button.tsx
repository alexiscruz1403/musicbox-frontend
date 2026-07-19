"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export function BackButton() {
  const router = useRouter();
  const t = useTranslations("Common");
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors mb-6 text-sm cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      {t("back")}
    </button>
  );
}
