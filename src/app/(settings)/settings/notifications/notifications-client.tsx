"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUpdateNotificationPrefs, ApiError } from "@/lib/api";
import type { NotificationPreferences } from "@/types/api";

interface NotificationsClientProps {
  initialPrefs: NotificationPreferences;
  accessToken: string;
}

interface ToggleRowProps {
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, on, disabled, onToggle }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      onClick={onToggle}
      className="flex items-center justify-between gap-4 w-full min-h-14 py-3 border-b border-mb-card last:border-b-0 text-left cursor-pointer disabled:cursor-not-allowed"
    >
      <span className="text-[15px] text-mb-text">{label}</span>
      <span
        aria-hidden
        className={cn(
          "shrink-0 w-11 h-6.5 rounded-full relative transition-colors",
          on ? "bg-mb-primary" : "bg-mb-border",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] w-5 h-5 rounded-full bg-mb-text transition-all",
            on ? "left-[21px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

export default function NotificationsClient({
  initialPrefs,
  accessToken,
}: NotificationsClientProps) {
  const [master, setMaster] = useState(true);
  const [likes, setLikes] = useState(initialPrefs.likesEnabled);
  const [dislikes, setDislikes] = useState(initialPrefs.dislikesEnabled);
  const [comments, setComments] = useState(initialPrefs.commentsEnabled);
  const [followers, setFollowers] = useState(initialPrefs.followsEnabled);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(setter: (fn: (v: boolean) => boolean) => void) {
    if (!master) return;
    setter((v) => !v);
    setSavedOk(false);
  }

  function handleSave() {
    setSaveError(null);
    setSavedOk(false);
    startTransition(async () => {
      try {
        await apiUpdateNotificationPrefs(accessToken, master
          ? {
              likesEnabled: likes,
              dislikesEnabled: dislikes,
              commentsEnabled: comments,
              followsEnabled: followers,
            }
          : {
              likesEnabled: false,
              dislikesEnabled: false,
              commentsEnabled: false,
              followsEnabled: false,
            });
        setSavedOk(true);
      } catch (err) {
        const apiErr = err as ApiError;
        setSaveError(apiErr.message || "No se pudieron guardar las preferencias.");
      }
    });
  }

  const rows: { key: string; label: string; on: boolean; onToggle: () => void }[] = [
    { key: "likes", label: "Me gusta en mis reseñas", on: likes, onToggle: () => toggle(setLikes) },
    {
      key: "dislikes",
      label: "No me gusta en mis reseñas",
      on: dislikes,
      onToggle: () => toggle(setDislikes),
    },
    {
      key: "comments",
      label: "Comentarios en mis reseñas",
      on: comments,
      onToggle: () => toggle(setComments),
    },
    {
      key: "followers",
      label: "Nuevos seguidores",
      on: followers,
      onToggle: () => toggle(setFollowers),
    },
  ];

  return (
    <div className="min-h-screen bg-mb-bg pb-28 md:pb-16">
      <header className="md:hidden sticky top-0 z-10 bg-mb-bg/80 backdrop-blur border-b border-mb-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="text-mb-muted hover:text-mb-text transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-mb-text">Notificaciones</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 md:py-14">
        <div className="hidden md:block mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h1 className="font-serif text-3xl text-mb-text mb-1.5">Notificaciones</h1>
          <p className="text-sm text-mb-muted mb-2">Elegí qué querés que te avisemos.</p>
          <span
            className="block h-0.5 w-full rounded-full mt-[18px]"
            style={{ background: "linear-gradient(90deg, #6B35D4, transparent)" }}
            aria-hidden
          />
        </div>

        {saveError && (
          <div
            role="alert"
            className="mb-6 bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
          >
            {saveError}
          </div>
        )}
        {savedOk && (
          <div
            role="status"
            className="mb-6 bg-mb-success/10 border border-mb-success rounded-lg px-4 py-3 text-mb-success text-sm"
          >
            ¡Preferencias guardadas!
          </div>
        )}

        {/* Master switch */}
        <button
          type="button"
          role="switch"
          aria-checked={master}
          onClick={() => {
            setMaster((v) => !v);
            setSavedOk(false);
          }}
          className={cn(
            "flex items-center justify-between gap-4 w-full min-h-16 px-4.5 py-4 bg-mb-card border rounded-xl text-left transition-colors",
            master ? "border-mb-ddp" : "border-mb-border",
          )}
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-mb-text">
              Recibir notificaciones
            </span>
            <span className="block text-[13px] text-mb-muted mt-0.5">
              {master
                ? "Estás recibiendo notificaciones."
                : "Todas las notificaciones están pausadas."}
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "shrink-0 w-[52px] h-[30px] rounded-full relative transition-colors",
              master ? "bg-mb-primary" : "bg-mb-border",
            )}
          >
            <span
              className={cn(
                "absolute top-[3px] w-6 h-6 rounded-full bg-mb-text transition-all",
                master ? "left-[25px]" : "left-[3px]",
              )}
            />
          </span>
        </button>

        <div className="h-px w-full bg-mb-border my-7" />

        {/* Individual toggles */}
        <div
          className={cn(
            "flex flex-col transition-opacity",
            master ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none",
          )}
        >
          {rows.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              on={row.on && master}
              disabled={!master}
              onToggle={row.onToggle}
            />
          ))}
        </div>

        {/* Save (desktop inline) */}
        <div className="hidden md:block mt-9">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="min-h-12 px-6.5 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-[15px] transition-colors disabled:opacity-70"
          >
            {isPending ? "Guardando…" : "Guardar preferencias"}
          </button>
        </div>
      </div>

      {/* Save (mobile sticky) */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-20 bg-mb-bg border-t border-mb-border px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full min-h-12 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-white font-semibold text-[15px] transition-colors disabled:opacity-70"
        >
          {isPending ? "Guardando…" : "Guardar preferencias"}
        </button>
      </div>
    </div>
  );
}
