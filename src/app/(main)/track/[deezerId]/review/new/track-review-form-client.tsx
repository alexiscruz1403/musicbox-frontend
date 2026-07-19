"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  apiCreateReview,
  apiUpdateReview,
  generateIdempotencyKey,
  ApiError,
} from "@/lib/api";
import { ratingColor, coverGradient } from "@/lib/review-format";
import type { CatalogTrack, ReviewDetail } from "@/types/api";

interface TrackReviewFormClientProps {
  track: CatalogTrack;
  accessToken: string;
  existingReview?: ReviewDetail;
}

const MAX_CHARS = 2000;

export function TrackReviewFormClient({
  track,
  accessToken,
  existingReview,
}: TrackReviewFormClientProps) {
  const router = useRouter();
  const t = useTranslations("Reviews.newTrack");
  const tForm = useTranslations("Reviews.form");
  const tCommon = useTranslations("Common");
  const mode = existingReview ? "edit" : "create";

  function mapApiError(err: ApiError): string {
    switch (err.code) {
      case "IDEMPOTENCY_KEY_REQUIRED":
        return tForm("errorIdempotency");
      case "REVIEW_ALREADY_EXISTS":
        return t("reviewedAlready");
      case "INVALID_UPDATE_FOR_TYPE":
        return tForm("errorInvalidUpdate");
      case "NOT_REVIEW_OWNER":
        return tForm("errorNotOwner");
      case "REVIEW_NOT_FOUND":
        return tForm("errorNotFound");
      default:
        return err.message || tCommon("genericError");
    }
  }

  const [score, setScore] = useState(
    existingReview ? Number(existingReview.rating) : 0,
  );
  const [body, setBody] = useState(existingReview?.description ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef(generateIdempotencyKey());

  const len = body.length;
  const canSubmit = score > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    setSaveError(null);

    startTransition(async () => {
      try {
        if (mode === "edit" && existingReview) {
          await apiUpdateReview(
            accessToken,
            existingReview.id,
            {
              description: body.trim() || undefined,
              rating: score,
            },
            idempotencyKey.current,
          );
          router.push(`/reviews/${existingReview.id}`);
        } else {
          const { data } = await apiCreateReview(
            accessToken,
            {
              type: "TRACK",
              deezerId: track.deezerId,
              description: body.trim() || undefined,
              rating: score,
            },
            idempotencyKey.current,
          );
          router.push(`/reviews/${data.id}`);
        }
        router.refresh();
      } catch (err) {
        setSaveError(mapApiError(err as ApiError));
      }
    });
  }

  return (
    <div className="relative min-h-screen bg-mb-bg text-mb-text font-sans">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={tCommon("back")}
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-[820px] mx-auto px-6 md:px-[clamp(20px,5vw,40px)] pt-[72px] pb-20">
        {/* Context header */}
        <div className="flex items-center gap-4 mb-9">
          <div
            className="shrink-0 w-[60px] h-[60px] rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
            style={
              track.coverUrl
                ? { backgroundImage: `url(${track.coverUrl})`, backgroundSize: "cover" }
                : { background: coverGradient(track.deezerId) }
            }
            role="img"
            aria-label={tCommon("coverAlt", { title: track.title })}
          />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-xl text-mb-text truncate">{track.title}</div>
            <div className="text-sm text-mb-muted mt-0.5 truncate">
              {track.artist.name} · {t("trackTypeLabel")}
            </div>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[32px] leading-[1.2] text-mb-text mb-9">
          {mode === "edit" ? tForm("editHeadingPrefix") : tForm("newHeadingPrefix")}
          <span className="text-mb-accent">{track.title}</span>
        </h1>
        {saveError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {saveError}
          </div>
        )}

        {/* Rating */}
        <div
          role="group"
          aria-label={t("scoreGroupAriaLabel")}
          className="mb-9"
        >
          <label
            htmlFor="mbScoreSlider"
            className="block text-[13px] font-semibold text-mb-muted uppercase tracking-wider mb-4"
          >
            {t("scoreLabel")}
          </label>
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
            <div className="order-1 md:order-2 shrink-0 flex items-baseline gap-1 justify-center md:justify-end">
              <span
                className="font-mono font-bold text-5xl leading-none text-right w-[5ch]"
                style={{ color: score === 0 ? "#5C5670" : ratingColor(score) }}
              >
                {score === 0 ? "—" : score.toFixed(2)}
              </span>
              <span className="font-mono text-lg text-mb-dim">/10</span>
            </div>
            <div className="order-2 md:order-1 w-full md:flex-1 flex flex-col gap-2">
              <input
                id="mbScoreSlider"
                type="range"
                min={0}
                max={10}
                step={0.25}
                value={score}
                onChange={(e) => {
                  const v = Math.round(parseFloat(e.target.value) * 4) / 4;
                  setScore(v);
                }}
                aria-valuetext={score === 0 ? tForm("unrated") : tForm("ratingOutOfTen", { rating: score.toFixed(2) })}
                className="w-full min-h-11 cursor-pointer"
                style={{ accentColor: score === 0 ? "#5C5670" : ratingColor(score) }}
              />
              <div
                aria-hidden
                className="flex justify-between font-mono text-[11px] text-mb-dim"
              >
                <span>0.25</span>
                <span>5.00</span>
                <span>10.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review text */}
        <div className="mb-7">
          <label
            htmlFor="mbReview"
            className="block text-[13px] font-semibold text-mb-muted uppercase tracking-wider mb-4"
          >
            {t("reviewLabel")} <span className="normal-case font-normal text-mb-dim">{tForm("optional")}</span>
          </label>
          <div className="relative">
            <textarea
              id="mbReview"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder={t("reviewPlaceholder")}
              className="w-full min-h-[200px] p-[18px] pb-10 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-none text-[15px] leading-relaxed"
            />
            <div
              aria-live="polite"
              className="absolute right-3.5 bottom-3 font-mono text-xs text-mb-dim"
            >
              {len} / {MAX_CHARS}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center min-h-12 px-5.5 rounded-lg text-mb-muted font-medium text-[15px] hover:text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
          >
            {tForm("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center justify-center min-h-12 px-6.5 rounded-lg font-semibold text-[15px] transition-all",
              canSubmit
                ? "bg-mb-primary hover:bg-mb-primary-h text-white hover:shadow-[0_0_20px_rgba(107,53,212,0.35)] cursor-pointer"
                : "bg-mb-border text-mb-dim cursor-not-allowed",
            )}
          >
            {isPending ? tForm("publishing") : mode === "edit" ? tForm("saveChanges") : tForm("publish")}
          </button>
        </div>
      </div>
    </div>
  );
}
