"use client";

import { useState, useTransition } from "react";
import { enqueueMutation } from "@/lib/offline/mutation-queue";
import type { CatalogAlbum, CatalogTrack, TrackReviewItemDto } from "@/types/api";

interface OfflineReviewFormProps {
  resourceType: "ALBUM" | "TRACK";
  deezerId: string;
  detail: CatalogAlbum | CatalogTrack;
  onDone: () => void;
  onCancel: () => void;
}

// Versión mínima (sin el polish visual del formulario real de
// /album|track/[id]/review/new) para crear una reseña sobre un recurso
// cacheado mientras no hay conexión. Encola la mutación con el payload real
// que espera POST /reviews — sync-manager.ts la reproduce tal cual al volver
// la conexión.
export function OfflineReviewForm({
  resourceType,
  deezerId,
  detail,
  onDone,
  onCancel,
}: OfflineReviewFormProps) {
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(8);
  const [trackRatings, setTrackRatings] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const [queued, setQueued] = useState(false);

  const album = resourceType === "ALBUM" ? (detail as CatalogAlbum) : null;

  function handleSubmit() {
    startTransition(async () => {
      if (resourceType === "ALBUM" && album) {
        const trackItems: TrackReviewItemDto[] = album.tracks.map((t) => ({
          deezerId: t.deezerId,
          rating: trackRatings[t.deezerId] ?? 5,
        }));
        await enqueueMutation("CREATE_REVIEW", {
          review: { type: "ALBUM", deezerId, description, trackItems },
        });
      } else {
        await enqueueMutation("CREATE_REVIEW", {
          review: { type: "TRACK", deezerId, description, rating },
        });
      }
      setQueued(true);
    });
  }

  if (queued) {
    return (
      <div className="p-4">
        <p className="text-sm text-mb-success mb-4">
          Reseña guardada. Se va a publicar automáticamente cuando vuelva la
          conexión.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-mb-accent cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-mb-accent cursor-pointer"
      >
        ← Cancelar
      </button>
      <h2 className="font-serif text-xl text-mb-text">Escribir reseña</h2>

      {resourceType === "TRACK" && (
        <div>
          <label className="block text-sm text-mb-muted mb-1">
            Puntaje (1-10)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-24 h-10 bg-mb-input border border-mb-border rounded-lg px-3 text-mb-text"
          />
        </div>
      )}

      {resourceType === "ALBUM" && album && (
        <div className="space-y-2">
          <p className="text-sm text-mb-muted">Puntuá cada canción (1-10)</p>
          {album.tracks.map((t) => (
            <div key={t.deezerId} className="flex items-center justify-between gap-3">
              <span className="text-sm text-mb-text truncate">{t.title}</span>
              <input
                type="number"
                min={1}
                max={10}
                value={trackRatings[t.deezerId] ?? 5}
                onChange={(e) =>
                  setTrackRatings((r) => ({ ...r, [t.deezerId]: Number(e.target.value) }))
                }
                className="w-16 h-9 bg-mb-input border border-mb-border rounded-lg px-2 text-mb-text shrink-0"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm text-mb-muted mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-mb-input border border-mb-border rounded-lg px-3 py-2 text-mb-text text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || description.trim().length === 0}
        className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-sm disabled:opacity-50 cursor-pointer"
      >
        Guardar (se sincroniza al reconectar)
      </button>
    </div>
  );
}
