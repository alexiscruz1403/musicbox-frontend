"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiPatchMe,
  apiUploadAvatar,
  apiCheckHandle,
  ApiError,
} from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import type { MeResponse } from "@/types/api";

type HandleStatus =
  | "idle"
  | "short"
  | "invalid"
  | "unchanged"
  | "checking"
  | "available"
  | "taken";

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const BIO_MAX = 300;

interface EditProfileClientProps {
  initialUser: MeResponse["user"];
  accessToken: string;
}

export default function EditProfileClient({
  initialUser,
  accessToken,
}: EditProfileClientProps) {
  const [displayName, setDisplayName] = useState(
    initialUser.displayName ?? "",
  );
  const [handle, setHandle] = useState(initialUser.handle ?? "");
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialUser.avatarUrl ?? null,
  );
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(
    null,
  );
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("unchanged");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const originalHandle = initialUser.handle;

  // Debounced handle check
  useEffect(() => {
    if (handle === originalHandle) {
      setHandleStatus("unchanged");
      return;
    }
    if (!handle) {
      setHandleStatus("idle");
      return;
    }
    if (handle.length < 3) {
      setHandleStatus("short");
      return;
    }
    if (!HANDLE_REGEX.test(handle)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiCheckHandle(handle, accessToken);
        setHandleStatus(data.available ? "available" : "taken");
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "HANDLE_INVALID_FORMAT") {
          setHandleStatus("invalid");
        } else {
          setHandleStatus("idle");
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [handle, originalHandle]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("La imagen no puede superar los 5MB.");
      return;
    }
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleSave() {
    if (handleStatus === "taken" || handleStatus === "invalid") return;
    setSaveError(null);
    setSavedOk(false);
    startTransition(async () => {
      try {
        // Upload avatar first if changed
        if (pendingAvatarFile) {
          await apiUploadAvatar(accessToken, pendingAvatarFile);
          setPendingAvatarFile(null);
        }

        // Build updates (only send changed fields)
        const updates: { handle?: string; displayName?: string; bio?: string } =
          {};
        if (displayName !== (initialUser.displayName ?? ""))
          updates.displayName = displayName;
        if (handle !== originalHandle) updates.handle = handle;
        if (bio !== (initialUser.bio ?? "")) updates.bio = bio;

        if (Object.keys(updates).length > 0) {
          await apiPatchMe(accessToken, updates);
        }

        setSavedOk(true);
        // Navigate to updated profile
        const newHandle = updates.handle ?? originalHandle;
        router.push(`/u/${newHandle}`);
        router.refresh();
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "HANDLE_TAKEN") {
          setHandleStatus("taken");
          setSaveError("Ese handle ya está en uso.");
        } else {
          setSaveError(apiErr.message ?? "Error al guardar. Intentá de nuevo.");
        }
      }
    });
  }

  const canSave =
    handleStatus !== "taken" &&
    handleStatus !== "invalid" &&
    handleStatus !== "checking" &&
    handleStatus !== "short" &&
    displayName.trim().length > 0 &&
    !isPending;

  return (
    <div className="min-h-screen bg-mb-bg">
      {/* Mobile sticky header */}
      <header className="md:hidden sticky top-0 z-10 bg-mb-bg/80 backdrop-blur border-b border-mb-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="text-mb-muted hover:text-mb-text transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-mb-text">Editar perfil</span>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="ml-auto text-sm font-semibold text-mb-primary disabled:text-mb-dim transition-colors"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
        {/* Desktop heading */}
        <div className="hidden md:block mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h1 className="font-serif text-3xl text-mb-text relative inline-block">
            Editar perfil
            <span
              className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #6B35D4, #C4A8F5, transparent)",
              }}
              aria-hidden
            />
          </h1>
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
            ¡Perfil actualizado!
          </div>
        )}

        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Vista previa del avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-mb-card"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-mb-card bg-mb-ddp flex items-center justify-center text-mb-accent text-2xl font-bold">
                {getInitials(displayName || initialUser.displayName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm text-mb-accent hover:text-mb-primary-h transition-colors"
          >
            Cambiar foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label="Seleccionar imagen de perfil"
          />
        </div>

        <div className="space-y-5">
          {/* Display name */}
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="block text-sm text-mb-muted font-medium"
            >
              Nombre para mostrar
            </label>
            <input
              id="displayName"
              type="text"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 bg-mb-input border border-mb-border focus:border-mb-primary rounded-xl px-4 text-mb-text placeholder:text-mb-dim outline-none transition-colors"
            />
          </div>

          {/* Handle */}
          <div className="space-y-1.5">
            <label
              htmlFor="handle"
              className="block text-sm text-mb-muted font-medium"
            >
              Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mb-dim font-mono text-sm select-none">
                @
              </span>
              <input
                id="handle"
                type="text"
                required
                maxLength={30}
                value={handle}
                onChange={(e) =>
                  setHandle(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                className={cn(
                  "w-full h-11 bg-mb-input border rounded-xl pl-8 pr-10 font-mono text-sm text-mb-text outline-none transition-colors",
                  handleStatus === "taken" || handleStatus === "invalid"
                    ? "border-mb-error"
                    : handleStatus === "available"
                      ? "border-mb-success"
                      : "border-mb-border focus:border-mb-primary",
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleStatus === "checking" && (
                  <svg
                    className="w-4 h-4 animate-spin text-mb-dim"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {handleStatus === "available" && (
                  <Check className="w-4 h-4 text-mb-success" />
                )}
                {(handleStatus === "taken" || handleStatus === "invalid") && (
                  <X className="w-4 h-4 text-mb-error" />
                )}
              </span>
            </div>
            {handleStatus === "taken" && (
              <p className="text-xs text-mb-error">
                Este handle ya está en uso.
              </p>
            )}
            {handleStatus === "available" && (
              <p className="text-xs text-mb-success">¡Handle disponible!</p>
            )}
            {handleStatus === "invalid" && (
              <p className="text-xs text-mb-error">
                Solo letras, números y guion bajo. Mínimo 3 caracteres.
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="bio"
                className="text-sm text-mb-muted font-medium"
              >
                Bio
              </label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  bio.length > BIO_MAX * 0.9
                    ? "text-mb-error"
                    : "text-mb-dim",
                )}
              >
                {bio.length} / {BIO_MAX}
              </span>
            </div>
            <textarea
              id="bio"
              maxLength={BIO_MAX}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Contá algo sobre vos y tu gusto musical…"
              className="w-full bg-mb-input border border-mb-border focus:border-mb-primary rounded-xl px-4 py-3 text-mb-text placeholder:text-mb-dim outline-none transition-colors resize-none text-sm"
            />
          </div>

          {/* Desktop save button */}
          <div className="hidden md:flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="px-6 h-11 bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
