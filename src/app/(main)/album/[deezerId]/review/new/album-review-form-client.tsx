"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiCreateReview,
  apiUpdateReview,
  generateIdempotencyKey,
  ApiError,
} from "@/lib/api";
import { ratingColor, coverGradient } from "@/lib/review-format";
import type { CatalogAlbum, ReviewDetail, TrackReviewItemDto } from "@/types/api";

const MAX_CHARS = 2000;

interface AlbumReviewFormClientProps {
  album: CatalogAlbum;
  accessToken: string;
  existingReview?: ReviewDetail;
}

function resolveInitialRatings(
  album: CatalogAlbum,
  existingReview: ReviewDetail | undefined,
): { ratings: Record<string, number>; notes: Record<string, string> } {
  const ratings: Record<string, number> = {};
  const notes: Record<string, string> = {};
  if (!existingReview?.trackReviewItems) return { ratings, notes };

  existingReview.trackReviewItems.forEach((item, index) => {
    const deezerId =
      item.deezerId ??
      album.tracks.find((t) => t.trackNumber === item.trackNumber)?.deezerId ??
      album.tracks[index]?.deezerId;
    if (!deezerId) return;
    ratings[deezerId] = item.rating;
    if (item.description) notes[deezerId] = item.description;
  });

  return { ratings, notes };
}

function mapApiError(err: ApiError): string {
  switch (err.code) {
    case "TRACK_NOT_IN_ALBUM":
      return "Una de las canciones seleccionadas no pertenece a este álbum.";
    case "IDEMPOTENCY_KEY_REQUIRED":
      return "Ocurrió un error al enviar tu reseña. Recargá la página e intentá de nuevo.";
    case "REVIEW_ALREADY_EXISTS":
      return "Ya tenés una reseña activa de este álbum.";
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

export function AlbumReviewFormClient({
  album,
  accessToken,
  existingReview,
}: AlbumReviewFormClientProps) {
  const router = useRouter();
  const mode = existingReview ? "edit" : "create";
  const initial = resolveInitialRatings(album, existingReview);

  const [description, setDescription] = useState(existingReview?.description ?? "");
  const [trackRatings, setTrackRatings] = useState<Record<string, number>>(initial.ratings);
  const [trackNotes, setTrackNotes] = useState<Record<string, string>>(initial.notes);
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef(generateIdempotencyKey());

  const ratedCount = Object.keys(trackRatings).length;
  const sum = Object.values(trackRatings).reduce((a, b) => a + b, 0);
  const avg = ratedCount > 0 ? sum / ratedCount : 0;
  const avgText = ratedCount > 0 ? avg.toFixed(2) : "—";

  const canSubmit = ratedCount > 0 && !isPending;

  function setRating(deezerId: string, value: number) {
    setTrackRatings((prev) => ({ ...prev, [deezerId]: value }));
  }

  function setNote(deezerId: string, value: string) {
    setTrackNotes((prev) => ({ ...prev, [deezerId]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setSaveError(null);

    const trackItems: TrackReviewItemDto[] = Object.entries(trackRatings).map(
      ([deezerId, rating]) => ({
        deezerId,
        rating,
        description: trackNotes[deezerId]?.trim() || undefined,
      }),
    );

    startTransition(async () => {
      try {
        if (mode === "edit" && existingReview) {
          await apiUpdateReview(
            accessToken,
            existingReview.id,
            {
              description: description.trim() || undefined,
              trackItems,
            },
            idempotencyKey.current,
          );
          router.push(`/reviews/${existingReview.id}`);
        } else {
          const { data } = await apiCreateReview(
            accessToken,
            {
              type: "ALBUM",
              deezerId: album.deezerId,
              description: description.trim() || undefined,
              trackItems,
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
    <div className="relative min-h-screen bg-mb-bg text-mb-text font-sans pb-44 md:pb-28">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="absolute top-5 left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-mb-border bg-mb-bg/50 backdrop-blur text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-[780px] mx-auto px-6 md:px-[clamp(20px,5vw,40px)] pt-[72px] pb-10">
        {/* Context header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="shrink-0 w-[60px] h-[60px] rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
            style={
              album.coverUrl
                ? { backgroundImage: `url(${album.coverUrl})`, backgroundSize: "cover" }
                : { background: coverGradient(album.deezerId) }
            }
            role="img"
            aria-label={`Cover de ${album.title}`}
          />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-xl text-mb-text truncate">{album.title}</div>
            <div className="text-sm text-mb-muted mt-0.5 truncate">
              {album.artist.name} · álbum
            </div>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[32px] leading-[1.2] text-mb-text mb-8">
          {mode === "edit" ? "Editar tu reseña de " : "Tu reseña de "}
          <span className="text-mb-accent">{album.title}</span>
        </h1>
        {saveError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {saveError}
          </div>
        )}

        {/* General review */}
        <div className="mb-10">
          <label
            htmlFor="mbGeneral"
            className="block text-[13px] font-semibold text-mb-muted uppercase tracking-wider mb-3.5"
          >
            ¿Tu impresión general del álbum?{" "}
            <span className="normal-case font-normal text-mb-dim">(opcional)</span>
          </label>
          <div className="relative">
            <textarea
              id="mbGeneral"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="Contanos qué te dejó el disco como conjunto: su arco, su producción, qué lo hace memorable…"
              className="w-full min-h-[120px] p-4 pb-8 bg-mb-input border border-mb-border focus:border-mb-primary rounded-lg text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-y text-[15px] leading-relaxed"
            />
            <div
              aria-live="polite"
              className="absolute right-3.5 bottom-2.5 font-mono text-xs text-mb-dim"
            >
              {description.length} / {MAX_CHARS}
            </div>
          </div>
        </div>

        {/* Songs */}
        <div className="mb-2">
          <h2 className="font-serif font-normal text-2xl text-mb-text mb-1">
            Calificá cada canción
          </h2>
          <p className="text-sm text-mb-muted mb-6">
            El rating del álbum será el promedio de tus calificaciones por canción.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {album.tracks.map((track, index) => {
            const rating = trackRatings[track.deezerId] ?? 0;
            const hasNote = (trackNotes[track.deezerId] ?? "").length > 0;
            const noteOpen = openNoteFor === track.deezerId;

            return (
              <div
                key={track.deezerId}
                className={cn(
                  "bg-mb-card border rounded-xl px-4.5 py-4 transition-colors",
                  rating >= 0.25 ? "border-mb-ddp" : "border-mb-border",
                )}
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <span className="shrink-0 w-[22px] font-mono text-xs text-mb-dim">
                    {track.trackNumber ?? index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] text-mb-text truncate">
                    {track.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.25}
                    value={rating}
                    onChange={(e) => {
                      const v = Math.round(parseFloat(e.target.value) * 4) / 4;
                      setRating(track.deezerId, v);
                    }}
                    aria-label={`Puntuación de ${track.title}`}
                    aria-valuetext={rating === 0 ? "Sin calificar" : `${rating.toFixed(2)} de 10`}
                    className="flex-1 min-h-8 cursor-pointer"
                    style={{ accentColor: rating === 0 ? "#5C5670" : ratingColor(rating) }}
                  />
                  <span className="shrink-0 flex items-baseline gap-1 justify-end">
                    <span
                      className="font-mono font-bold text-xl leading-none text-right w-[5ch]"
                      style={{ color: rating === 0 ? "#5C5670" : ratingColor(rating) }}
                    >
                      {rating === 0 ? "—" : rating.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs text-mb-dim">/10</span>
                  </span>
                </div>
                <div className="mt-3">
                  {noteOpen ? (
                    <div>
                      <textarea
                        value={trackNotes[track.deezerId] ?? ""}
                        onChange={(e) => setNote(track.deezerId, e.target.value)}
                        placeholder="Nota sobre esta canción…"
                        className="w-full min-h-16 p-3 bg-[#16161F] border border-mb-border focus:border-mb-primary rounded-md text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-y text-sm leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenNoteFor(null)}
                        className="mt-1.5 text-xs text-mb-dim hover:text-mb-muted transition-colors cursor-pointer"
                      >
                        Ocultar nota
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenNoteFor(track.deezerId)}
                      className="inline-flex items-center gap-1.5 min-h-9  rounded-md text-mb-muted text-[13px] font-medium hover:text-mb-accent hover:bg-mb-input transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {hasNote ? "Editar nota" : "Agregar nota"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed left-0 right-0 bottom-16 md:bottom-0 z-30 bg-mb-card border-t border-mb-border">
        <div className="max-w-[780px] mx-auto px-4 md:px-[clamp(16px,5vw,40px)] py-3.5 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-mb-dim uppercase tracking-wider">
              Promedio actual
            </span>
            <span className="flex items-baseline gap-1">
              <span
                className="font-mono font-bold text-2xl leading-none"
                style={{ color: ratedCount > 0 ? ratingColor(avg) : "#5C5670" }}
              >
                {avgText}
              </span>
              <span className="font-mono text-[13px] text-mb-dim">/10</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden md:inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-mb-muted font-medium text-sm hover:text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "inline-flex items-center justify-center min-h-11 px-5.5 rounded-lg font-semibold text-sm transition-all",
                canSubmit
                  ? "bg-mb-primary hover:bg-mb-primary-h text-white hover:shadow-[0_0_20px_rgba(107,53,212,0.35)] cursor-pointer"
                  : "bg-mb-border text-mb-dim cursor-not-allowed",
              )}
            >
              {isPending
                ? "Publicando…"
                : mode === "edit"
                  ? "Guardar cambios"
                  : "Publicar reseña"}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-mb-dim pb-2.5">
          {ratedCount} de {album.tracks.length} canciones calificadas
        </p>
      </div>
    </div>
  );
}
