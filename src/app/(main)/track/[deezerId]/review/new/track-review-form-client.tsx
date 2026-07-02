"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

const MIN_CHARS = 50;

function mapApiError(err: ApiError): string {
  switch (err.code) {
    case "IDEMPOTENCY_KEY_REQUIRED":
      return "Ocurrió un error al enviar tu reseña. Recargá la página e intentá de nuevo.";
    case "REVIEW_ALREADY_EXISTS":
      return "Ya tenés una reseña activa de esta canción.";
    case "INVALID_UPDATE_FOR_TYPE":
      return "No se puede modificar ese campo para este tipo de reseña.";
    case "NOT_REVIEW_OWNER":
      return "No tenés permiso para modificar esta reseña.";
    case "REVIEW_NOT_FOUND":
      return "Esta reseña ya no existe.";
    default:
      return err.message || "Ocurrió un error. Intentá de nuevo.";
  }
}

export function TrackReviewFormClient({
  track,
  accessToken,
  existingReview,
}: TrackReviewFormClientProps) {
  const router = useRouter();
  const mode = existingReview ? "edit" : "create";

  const [score, setScore] = useState(
    existingReview ? Math.round(Number(existingReview.rating)) : 0,
  );
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existingReview?.description ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef(generateIdempotencyKey());

  const display = hover || score;
  const len = body.trim().length;
  const remaining = Math.max(0, MIN_CHARS - len);
  const enough = len >= MIN_CHARS;
  const canSubmit = score > 0 && enough && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    setSaveError(null);

    startTransition(async () => {
      try {
        if (mode === "edit" && existingReview) {
          await apiUpdateReview(accessToken, existingReview.id, {
            description: body.trim(),
            rating: score,
          });
          router.push(`/reviews/${existingReview.id}`);
        } else {
          const { data } = await apiCreateReview(
            accessToken,
            {
              type: "TRACK",
              deezerId: track.deezerId,
              description: body.trim(),
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
        aria-label="Volver"
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors"
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
            aria-label={`Cover de ${track.title}`}
          />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-xl text-mb-text truncate">{track.title}</div>
            <div className="text-sm text-mb-muted mt-0.5 truncate">
              {track.artist.name} · canción
            </div>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[32px] leading-[1.2] text-mb-text mb-2">
          {mode === "edit" ? "Editar tu reseña de " : "Tu reseña de "}
          <span className="text-mb-accent">{track.title}</span>
        </h1>
        <div
          aria-hidden
          className="h-px w-40 mb-9"
          style={{ background: "linear-gradient(90deg,#6B35D4,transparent)" }}
        />

        {saveError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {saveError}
          </div>
        )}

        {/* Rating */}
        <div role="group" aria-label="Puntuación: elegí de 1 a 10" className="mb-9">
          <label className="block text-[13px] font-semibold text-mb-muted uppercase tracking-wider mb-4">
            Tu puntaje
          </label>
          <div className="flex items-center gap-6">
            <div className="flex gap-2 overflow-x-auto lg:overflow-x-hidden no-scrollbar overflow-y-hidden">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
                const filled = v <= display;
                const color = ratingColor(display || 1);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setScore(v)}
                    onMouseEnter={() => setHover(v)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`Puntaje ${v} de 10`}
                    aria-pressed={v === score}
                    className="shrink-0 w-11 h-11 rounded-full font-mono font-bold text-sm transition-transform hover:scale-105"
                    style={{
                      border: `1.5px solid ${filled ? color : "#252332"}`,
                      background: filled ? color : "transparent",
                      color: filled ? "#0A0A0F" : "#9B95B0",
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 flex items-baseline gap-1 min-w-[84px]">
              <span
                className="font-mono font-bold text-5xl leading-none"
                style={{ color: display === 0 ? "#5C5670" : ratingColor(display) }}
              >
                {display === 0 ? "—" : display}
              </span>
              <span className="font-mono text-lg text-mb-dim">/10</span>
            </div>
          </div>
        </div>

        {/* Review text */}
        <div className="mb-7">
          <label
            htmlFor="mbReview"
            className="block text-[13px] font-semibold text-mb-muted uppercase tracking-wider mb-4"
          >
            Tu reseña
          </label>
          <div className="relative">
            <textarea
              id="mbReview"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="¿Qué te pareció? Contanos qué te hizo sentir esta canción, qué destacás o qué mejorarías…"
              className="w-full min-h-[200px] p-[18px] pb-10 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-none text-[15px] leading-relaxed"
            />
            <div
              aria-live="polite"
              className="absolute right-3.5 bottom-3 font-mono text-xs"
              style={{ color: enough ? "#7C6CAD" : "#5C5670" }}
            >
              {enough ? `${len} caracteres` : `Faltan ${remaining} · mín. ${MIN_CHARS}`}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-12 px-5.5 rounded-lg text-mb-muted font-medium text-[15px] hover:text-mb-text hover:bg-mb-input transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "min-h-12 px-6.5 rounded-lg font-semibold text-[15px] transition-all",
              canSubmit
                ? "bg-mb-primary hover:bg-mb-primary-h text-white hover:shadow-[0_0_20px_rgba(107,53,212,0.35)] cursor-pointer"
                : "bg-mb-border text-mb-dim cursor-not-allowed",
            )}
          >
            {isPending ? "Publicando…" : mode === "edit" ? "Guardar cambios" : "Publicar reseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
