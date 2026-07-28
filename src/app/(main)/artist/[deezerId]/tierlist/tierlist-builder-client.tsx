"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiCreateTierlist, apiUpdateTierlist, generateIdempotencyKey, ApiError } from "@/lib/api";
import { coverGradient } from "@/lib/review-format";
import { TIER_COLORS, TIER_ORDER } from "@/lib/tierlist";
import { useBoardDrag } from "@/hooks/use-board-drag";
import { Modal } from "@/components/ui/modal";
import { AlbumTile, TierRow, type BoardAlbum } from "@/components/tierlists/tier-board";
import type { CatalogAlbum, TierRank, Tierlist, TierlistItemInput } from "@/types/api";

const POOL = "pool";
type Zone = TierRank | typeof POOL;

type Lists = Record<Zone, string[]>;

interface BuilderAlbum extends BoardAlbum {
  year: string | null;
}

interface TierlistBuilderClientProps {
  artistDeezerId: string;
  artistName: string;
  artistImageUrl: string | null;
  albums: CatalogAlbum[];
  existing?: Tierlist;
  accessToken: string;
}

function emptyLists(): Lists {
  const lists = { [POOL]: [] } as Partial<Lists>;
  for (const tier of TIER_ORDER) lists[tier] = [];
  return lists as Lists;
}

export function TierlistBuilderClient({
  artistDeezerId,
  artistName,
  artistImageUrl,
  albums,
  existing,
  accessToken,
}: TierlistBuilderClientProps) {
  const router = useRouter();
  const t = useTranslations("Tierlist.builder");
  const tTiers = useTranslations("Tierlist.tiers");
  const tCommon = useTranslations("Common");

  // La discografía del catálogo es la fuente de los covers, pero una tierlist
  // en edición puede referenciar un álbum que ya no vuelve en /albums/all: su
  // snapshot (externalAlbumTitle/externalCoverUrl) lo cubre para no perderlo.
  const albumsById = useMemo(() => {
    const map = new Map<string, BuilderAlbum>();
    for (const a of albums) {
      map.set(a.deezerId, {
        deezerId: a.deezerId,
        title: a.title,
        coverUrl: a.coverUrl,
        year: a.releaseDate ? a.releaseDate.slice(0, 4) : null,
      });
    }
    for (const row of existing?.tiers ?? []) {
      for (const a of row.albums) {
        if (map.has(a.deezerId)) continue;
        map.set(a.deezerId, {
          deezerId: a.deezerId,
          title: a.externalAlbumTitle,
          coverUrl: a.externalCoverUrl,
          year: null,
        });
      }
    }
    return map;
  }, [albums, existing]);

  const initialLists = useMemo(() => {
    const lists = emptyLists();
    const placed = new Set<string>();
    for (const row of existing?.tiers ?? []) {
      for (const a of row.albums) {
        lists[row.tier].push(a.deezerId);
        placed.add(a.deezerId);
      }
    }
    for (const deezerId of albumsById.keys()) {
      if (!placed.has(deezerId)) lists[POOL].push(deezerId);
    }
    return lists;
  }, [existing, albumsById]);

  const [lists, setLists] = useState<Lists>(initialLists);
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const idempotencyKey = useRef(generateIdempotencyKey());

  const total = albumsById.size;
  const assigned = total - lists[POOL].length;

  const move = useCallback((id: string, target: string, beforeId?: string) => {
    setLists((prev) => {
      const next = {} as Lists;
      for (const key of Object.keys(prev) as Zone[]) {
        next[key] = prev[key].filter((x) => x !== id);
      }
      const arr = next[target as Zone];
      if (!arr) return prev;
      const idx = beforeId && beforeId !== id ? arr.indexOf(beforeId) : -1;
      if (idx === -1) arr.push(id);
      else arr.splice(idx, 0, id);
      return next;
    });
    setPickerId(null);
  }, []);

  const { draggingId, overZone, point, startDrag, suppressClick } = useBoardDrag({
    onDrop: move,
  });

  function renderTile(id: string, size: number) {
    const album = albumsById.get(id);
    if (!album) return null;
    return (
      <AlbumTile
        key={id}
        album={album}
        size={size}
        artistName={artistName}
        open={false}
        // Al soltar, algunos navegadores emiten igual un click sobre el origen:
        // se ignora para no abrir el selector apenas termina el arrastre.
        onSelect={() => {
          if (!suppressClick()) setPickerId(id);
        }}
        onPointerDown={(e) => startDrag(e, id)}
        dragging={draggingId === id}
      />
    );
  }

  const draggingAlbum = draggingId ? albumsById.get(draggingId) : null;

  function handleSave() {
    setError(null);
    const items: TierlistItemInput[] = TIER_ORDER.flatMap((tier) =>
      lists[tier].map((albumDeezerId) => ({ albumDeezerId, tier })),
    );

    startSaving(async () => {
      try {
        const { data } = existing
          ? await apiUpdateTierlist(accessToken, existing.id, items, idempotencyKey.current)
          : await apiCreateTierlist(
              accessToken,
              artistDeezerId,
              items,
              idempotencyKey.current,
            );
        router.push(`/tierlists/${data.id}`);
        router.refresh();
      } catch (err) {
        // Una key reusada tras un error devolvería la respuesta cacheada del
        // intento fallido, así que el reintento va con una nueva.
        idempotencyKey.current = generateIdempotencyKey();
        const apiErr = err as ApiError;
        switch (apiErr.code) {
          case "TIERLIST_ALREADY_EXISTS":
            setError(t("errorAlreadyExists"));
            break;
          case "ALBUM_NOT_IN_ARTIST":
            setError(t("errorAlbumNotInArtist"));
            break;
          case "DUPLICATE_ALBUM_IN_TIERLIST":
            setError(t("errorDuplicateAlbum"));
            break;
          case "USER_PENALIZED":
          case "ACCOUNT_SUSPENDED":
            setError(t("errorPenalized"));
            break;
          default:
            setError(apiErr.message || t("errorGeneric"));
        }
      }
    });
  }

  const pickerAlbum = pickerId ? albumsById.get(pickerId) : null;

  return (
    // Mientras se arrastra con mouse, el movimiento con el botón apretado
    // seleccionaría el texto del tablero: se desactiva durante el gesto.
    <div
      className={cn(
        "min-h-screen bg-mb-bg text-mb-text font-sans",
        draggingId && "select-none cursor-grabbing",
      )}
    >
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 md:px-[clamp(16px,4vw,40px)] pt-7 pb-40">
        {/* Header */}
        <header className="flex items-start gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push(`/artist/${artistDeezerId}`)}
            aria-label={t("backAriaLabel")}
            className="shrink-0 w-11 h-11 flex items-center justify-center bg-mb-card border border-mb-border rounded-xl text-mb-text hover:bg-mb-input transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-2.5">
              {artistImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artistImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : null}
              <span className="inline-block px-2.5 py-0.5 border border-mb-ddp rounded-full text-[11px] tracking-widest uppercase text-mb-accent font-semibold truncate">
                {artistName}
              </span>
            </div>
            <h1 className="font-serif font-normal text-[26px] md:text-[34px] leading-[1.05] text-mb-text mb-1.5">
              {existing ? t("headingEdit") : t("headingCreate")}
            </h1>
            <p className="text-sm text-mb-muted">{t("subheading")}</p>
          </div>
          <button
            type="button"
            onClick={() => setLists({ ...emptyLists(), [POOL]: [...albumsById.keys()] })}
            className="shrink-0 inline-flex items-center gap-2 min-h-11 px-4 bg-mb-card border border-mb-border rounded-xl text-mb-muted font-semibold text-[13px] hover:text-mb-text hover:border-mb-ddp transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{t("reset")}</span>
          </button>
        </header>

        {albums.length === 0 && !existing ? (
          <p className="text-mb-muted text-sm py-12 text-center">{t("noAlbums")}</p>
        ) : (
          <>
            {/* Tablero */}
            <div className="bg-mb-card border border-mb-border rounded-[14px]">
              {TIER_ORDER.map((tier, i) => (
                <TierRow
                  key={tier}
                  tier={tier}
                  count={lists[tier].length}
                  first={i === 0}
                  last={i === TIER_ORDER.length - 1}
                  highlighted={overZone === tier}
                  emptyLabel={t("emptyRow")}
                  dropZoneId={tier}
                >
                  {lists[tier].map((id) => renderTile(id, 72))}
                </TierRow>
              ))}
            </div>

            {/* Sin asignar */}
            <section className="mt-6 bg-mb-card border border-mb-border rounded-[14px] p-4.5">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[13px] font-semibold tracking-wider uppercase text-mb-muted">
                  {t("poolHeading")}
                </h2>
                <span className="font-mono text-xs font-bold text-mb-dim">
                  {lists[POOL].length} / {total}
                </span>
              </div>
              <div
                data-drop-zone={POOL}
                className={cn(
                  "flex flex-wrap gap-3 min-h-22 p-2 border-[1.5px] border-dashed rounded-xl transition-colors",
                  overZone === POOL
                    ? "border-mb-primary bg-mb-primary/10"
                    : "border-mb-border bg-transparent",
                )}
              >
                {lists[POOL].length === 0 ? (
                  <span className="flex items-center min-h-[72px] text-[13px] text-mb-dim pointer-events-none">
                    {t("poolEmpty")}
                  </span>
                ) : (
                  lists[POOL].map((id) => renderTile(id, 72))
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Portada "levantada" que sigue al puntero — el equivalente a la drag
          image del navegador, que con Pointer Events no existe. */}
      {draggingAlbum && point && (
        <div
          aria-hidden
          // Por encima de la barra de guardado y del tab bar mobile (z-50),
          // por debajo de los modales (z-70).
          className="fixed z-[60] pointer-events-none rounded-[9px] shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
          style={{
            left: point.x,
            top: point.y,
            width: 72,
            height: 72,
            transform: "translate(-50%, -50%) scale(1.1)",
            background: draggingAlbum.coverUrl
              ? `url(${draggingAlbum.coverUrl}) center/cover`
              : coverGradient(draggingAlbum.deezerId),
          }}
        />
      )}

      {/* Barra de guardado */}
      <div className="fixed inset-x-0 bottom-16 md:bottom-0 z-40 bg-mb-card/95 backdrop-blur border-t border-mb-border safe-b">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-mb-muted truncate">
              {t("assignedCount", { count: assigned })}
            </p>
            {error && (
              <p role="alert" className="text-mb-error text-xs mt-0.5">
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 min-h-11 px-5 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>

      {/* Selector de tier — el camino táctil y de teclado equivalente al drag */}
      {pickerAlbum && (
        <Modal
          open
          onClose={() => setPickerId(null)}
          ariaLabel={t("pickerAriaLabel", { title: pickerAlbum.title })}
          panelClassName="w-full sm:max-w-[400px] max-h-[90vh] overflow-y-auto bg-mb-card border border-mb-border rounded-t-2xl sm:rounded-xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          <div className="mb-4">
            <p className="font-mono text-[11px] text-mb-accent truncate">{artistName}</p>
            <p className="font-serif text-lg text-mb-text leading-tight">{pickerAlbum.title}</p>
            {pickerAlbum.year && (
              <p className="font-mono text-xs font-bold text-mb-muted mt-0.5">{pickerAlbum.year}</p>
            )}
          </div>
          <p className="text-xs uppercase tracking-wider text-mb-dim mb-2">{t("moveTo")}</p>
          <div className="flex flex-col gap-1">
            {TIER_ORDER.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => move(pickerAlbum.deezerId, tier)}
                className={cn(
                  "flex items-center gap-3 w-full min-h-11 px-3 rounded-lg text-sm text-left transition-colors cursor-pointer",
                  lists[tier].includes(pickerAlbum.deezerId)
                    ? "bg-mb-input text-mb-text font-semibold"
                    : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
                )}
              >
                <span
                  aria-hidden
                  className="shrink-0 w-3 h-3 rounded-full"
                  style={{ background: TIER_COLORS[tier] }}
                />
                {tTiers(tier)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => move(pickerAlbum.deezerId, POOL)}
              className={cn(
                "flex items-center gap-3 w-full min-h-11 px-3 mt-1 border-t border-mb-border rounded-lg text-sm text-left transition-colors cursor-pointer",
                lists[POOL].includes(pickerAlbum.deezerId)
                  ? "text-mb-text font-semibold"
                  : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
              )}
            >
              <span
                aria-hidden
                className="shrink-0 w-3 h-3 rounded-full border border-mb-border"
              />
              {t("unassign")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPickerId(null)}
            className="w-full min-h-11 mt-4 bg-mb-input border border-mb-border rounded-lg text-sm font-medium text-mb-text hover:border-mb-primary/50 transition-colors cursor-pointer"
          >
            {tCommon("back")}
          </button>
        </Modal>
      )}
    </div>
  );
}
