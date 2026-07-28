"use client";

import type { PointerEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { coverGradient } from "@/lib/review-format";
import { TIER_COLORS, TIER_LABEL_FG, TIER_ORDER } from "@/lib/tierlist";
import type { TierRank, TierlistTier } from "@/types/api";

// Piezas compartidas del tablero de 7 filas. El detalle usa <TierBoard>
// directamente (read-only); el armador compone <TierRow>/<AlbumTile> por su
// cuenta porque además tiene el pool de "sin asignar", que no es un tier.

export interface BoardAlbum {
  deezerId: string;
  title: string;
  coverUrl: string | null;
}

interface AlbumTileProps {
  album: BoardAlbum;
  size: number;
  /** Título del popover — el artista; el subtítulo es el título del álbum. */
  artistName: string;
  subtitle?: string | null;
  open: boolean;
  onSelect: () => void;
  /** Presente sólo en el armador: arranca el gesto de arrastre (ver useBoardDrag). */
  onPointerDown?: (e: PointerEvent) => void;
  dragging?: boolean;
}

export function AlbumTile({
  album,
  size,
  artistName,
  subtitle,
  open,
  onSelect,
  onPointerDown,
  dragging = false,
}: AlbumTileProps) {
  const draggable = !!onPointerDown;

  return (
    <div className="relative shrink-0" data-album-id={album.deezerId}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={onPointerDown}
        title={album.title}
        aria-label={album.title}
        style={{
          width: size,
          height: size,
          background: album.coverUrl
            ? `url(${album.coverUrl}) center/cover`
            : coverGradient(album.deezerId),
          opacity: dragging ? 0.35 : 1,
          // El long-press táctil no debe seleccionar ni abrir el callout de iOS;
          // `manipulation` deja scrollear la página pero mata el double-tap zoom.
          touchAction: draggable ? "manipulation" : undefined,
          WebkitTouchCallout: draggable ? "none" : undefined,
        }}
        className={cn(
          "block rounded-[9px] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.45)] transition-transform",
          draggable ? "cursor-grab select-none" : "cursor-pointer",
          !dragging && "hover:-translate-y-0.5",
        )}
      />
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 min-w-[132px] max-w-[200px] px-3 py-2.5 bg-mb-card border border-mb-ddp rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <div className="font-mono text-[11px] text-mb-accent mb-0.5 truncate">
            {artistName}
          </div>
          <div className="font-serif text-[15px] text-mb-text leading-tight">
            {album.title}
          </div>
          {subtitle && (
            <div className="mt-1 font-mono text-xs font-bold text-mb-muted">{subtitle}</div>
          )}
          <span
            aria-hidden
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #3D1A7A",
            }}
          />
        </div>
      )}
    </div>
  );
}

interface TierRowProps {
  tier: TierRank;
  count: number;
  first: boolean;
  last: boolean;
  highlighted?: boolean;
  emptyLabel: string;
  /** Presente sólo en el armador: marca la fila como destino de drop. */
  dropZoneId?: string;
  children: ReactNode;
}

export function TierRow({
  tier,
  count,
  first,
  last,
  highlighted = false,
  emptyLabel,
  dropZoneId,
  children,
}: TierRowProps) {
  const t = useTranslations("Tierlist.tiers");

  return (
    <div className="flex items-stretch border-b border-mb-bg last:border-b-0 min-h-[92px]">
      <div
        className="shrink-0 w-[92px] sm:w-[132px] flex flex-col items-center justify-center text-center px-2 py-2.5"
        style={{
          background: TIER_COLORS[tier],
          borderTopLeftRadius: first ? 13 : 0,
          borderBottomLeftRadius: last ? 13 : 0,
        }}
      >
        <span
          className="font-serif text-[15px] sm:text-[17px] leading-tight"
          style={{ color: TIER_LABEL_FG }}
        >
          {t(tier)}
        </span>
        <span
          className="font-mono text-[10px] font-bold mt-0.5"
          style={{ color: "rgba(23,16,33,0.55)" }}
        >
          {count === 0 ? "—" : count}
        </span>
      </div>
      <div
        data-drop-zone={dropZoneId}
        className={cn(
          "flex-1 min-w-0 flex flex-wrap content-start gap-2.5 p-3 transition-colors",
          highlighted && "bg-mb-primary/15",
        )}
      >
        {count === 0 ? (
          <span className="flex items-center min-h-[68px] text-xs italic text-mb-dim/70 pointer-events-none">
            {emptyLabel}
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface TierBoardProps {
  tiers: TierlistTier[];
  artistName: string;
  openId: string | null;
  onSelect: (deezerId: string | null) => void;
}

/** Tablero read-only — el que renderiza la página de detalle. */
export function TierBoard({ tiers, artistName, openId, onSelect }: TierBoardProps) {
  const t = useTranslations("Tierlist.detail");
  const byTier = new Map(tiers.map((row) => [row.tier, row.albums]));

  return (
    <div className="bg-mb-card border border-mb-border rounded-[14px]">
      {TIER_ORDER.map((tier, i) => {
        const albums = byTier.get(tier) ?? [];
        return (
          <TierRow
            key={tier}
            tier={tier}
            count={albums.length}
            first={i === 0}
            last={i === TIER_ORDER.length - 1}
            emptyLabel={t("emptyRow")}
          >
            {albums.map((a) => (
              <AlbumTile
                key={a.id}
                album={{
                  deezerId: a.deezerId,
                  title: a.externalAlbumTitle,
                  coverUrl: a.externalCoverUrl,
                }}
                size={68}
                artistName={artistName}
                open={openId === a.id}
                onSelect={() => onSelect(openId === a.id ? null : a.id)}
              />
            ))}
          </TierRow>
        );
      })}
    </div>
  );
}
