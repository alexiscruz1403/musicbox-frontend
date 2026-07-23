"use client";

import { Download, Share, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallBanner() {
  const t = useTranslations("Feed.installBanner");
  const { mode, install, dismiss } = usePwaInstall();

  if (mode === "hidden") return null;

  return (
    <section
      aria-label={t("heading")}
      className="relative flex items-start gap-3.5 bg-mb-card border border-mb-border rounded-xl px-4.5 py-4 mb-5"
    >
      <span
        aria-hidden
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-mb-ddp text-mb-accent"
      >
        <Download className="w-5 h-5" />
      </span>

      <div className="min-w-0 flex-1 pr-6">
        <h2 className="text-[15px] font-semibold text-mb-text">{t("heading")}</h2>
        <p className="text-[13px] leading-relaxed text-mb-muted mt-0.5">{t("body")}</p>

        {mode === "prompt" ? (
          <button
            type="button"
            onClick={install}
            className="mt-3 min-h-10 px-4 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {t("installCta")}
          </button>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-mb-text mt-2.5">
            <Share aria-hidden className="shrink-0 w-4 h-4 text-mb-accent" />
            {t("iosInstruction")}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismissLabel")}
        className="absolute top-3 right-3 p-1 rounded-md text-mb-muted hover:text-mb-text transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </section>
  );
}
