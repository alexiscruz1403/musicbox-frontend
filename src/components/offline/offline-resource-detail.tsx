"use client";

import { useState } from "react";
import type {
  RecentlyViewedDetailItem,
  CatalogAlbum,
  CatalogTrack,
  ArtistDetail,
} from "@/types/api";
import { OfflineReviewForm } from "./offline-review-form";

interface OfflineResourceDetailProps {
  item: RecentlyViewedDetailItem;
  onBack: () => void;
}

export function OfflineResourceDetail({ item, onBack }: OfflineResourceDetailProps) {
  const [reviewing, setReviewing] = useState(false);

  if (!item.detail) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-mb-accent cursor-pointer mb-4"
        >
          ← Volver
        </button>
        <p className="text-mb-muted text-sm">
          Este recurso no se pudo guardar para uso offline
          {item.error ? ` (${item.error.message})` : ""}.
        </p>
      </div>
    );
  }

  if (reviewing && (item.resourceType === "ALBUM" || item.resourceType === "TRACK")) {
    return (
      <OfflineReviewForm
        resourceType={item.resourceType}
        deezerId={item.deezerId}
        detail={item.detail as CatalogAlbum | CatalogTrack}
        onDone={onBack}
        onCancel={() => setReviewing(false)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-mb-accent cursor-pointer"
      >
        ← Volver a recientes
      </button>

      {item.resourceType === "ARTIST" ? (
        <ArtistOfflineDetail detail={item.detail as ArtistDetail} />
      ) : item.resourceType === "ALBUM" ? (
        <AlbumOfflineDetail detail={item.detail as CatalogAlbum} />
      ) : (
        <TrackOfflineDetail detail={item.detail as CatalogTrack} />
      )}

      {(item.resourceType === "ALBUM" || item.resourceType === "TRACK") && (
        <button
          type="button"
          onClick={() => setReviewing(true)}
          className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-sm cursor-pointer"
        >
          Escribir reseña
        </button>
      )}
    </div>
  );
}

function AlbumOfflineDetail({ detail }: { detail: CatalogAlbum }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-mb-text mb-1">{detail.title}</h2>
      <p className="text-mb-muted text-sm mb-4">{detail.artist.name}</p>
      <ul className="space-y-1">
        {detail.tracks.map((t, i) => (
          <li key={t.deezerId} className="text-sm text-mb-text">
            {i + 1}. {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrackOfflineDetail({ detail }: { detail: CatalogTrack }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-mb-text mb-1">{detail.title}</h2>
      <p className="text-mb-muted text-sm">{detail.artist.name}</p>
      {detail.albumTitle && (
        <p className="text-mb-dim text-xs mt-1">del álbum {detail.albumTitle}</p>
      )}
    </div>
  );
}

function ArtistOfflineDetail({ detail }: { detail: ArtistDetail }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-mb-text mb-4">{detail.artist.name}</h2>
      <h3 className="text-sm font-semibold text-mb-muted mb-2">Más reseñados</h3>
      <ul className="space-y-1">
        {detail.topReviewedAlbums.map((a) => (
          <li key={a.deezerId} className="text-sm text-mb-text">
            {a.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
