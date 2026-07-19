"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { setLocale } from "@/lib/locale-actions";
import type { AppLocale } from "@/i18n/locale";

const LOCALES: AppLocale[] = ["en", "es"];

export function LanguageToggle() {
  const t = useTranslations("Settings.Language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: AppLocale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 min-h-16 px-4.5 py-4 bg-mb-card border border-mb-border rounded-xl">
      <span className="shrink-0 w-[42px] h-[42px] rounded-[10px] bg-mb-dp flex items-center justify-center text-mb-accent text-lg">
        🌐
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-mb-text">{t("title")}</span>
        <span className="block text-[13px] text-mb-muted mt-0.5">{t("subtitle")}</span>
      </span>
      <div
        role="group"
        aria-label={t("title")}
        className="shrink-0 flex items-center gap-1 bg-mb-input rounded-full p-1"
      >
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={locale === code}
            disabled={isPending}
            onClick={() => handleSelect(code)}
            className={cn(
              "min-w-11 min-h-8 px-3 rounded-full text-xs font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed",
              locale === code
                ? "bg-mb-primary text-white"
                : "bg-transparent text-mb-muted hover:text-mb-text",
            )}
          >
            {t(code)}
          </button>
        ))}
      </div>
    </div>
  );
}
