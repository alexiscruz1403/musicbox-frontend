"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiResetPassword, type ApiError } from "@/lib/api";
import { getPasswordStrength, STRENGTH_COLORS } from "@/lib/password-strength";

type LinkInvalidReason = "invalid" | "oauth";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [touchedPw2, setTouchedPw2] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState<LinkInvalidReason | null>(
    !userId || !token ? "invalid" : null,
  );
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const strength = getPasswordStrength(pw1);
  const mismatch = touchedPw2 && pw2.length > 0 && pw1 !== pw2;
  const valid = pw1.length >= 8 && pw1 === pw2 && pw2.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouchedPw2(true);
    if (!valid || !userId || !token) return;

    startTransition(async () => {
      try {
        await apiResetPassword(userId, token, pw1);
        setSuccess(true);
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "INVALID_RESET_TOKEN") {
          setLinkInvalid("invalid");
        } else if (apiErr.code === "OAUTH_ACCOUNT_NO_PASSWORD") {
          setLinkInvalid("oauth");
        } else {
          setLinkInvalid("invalid");
        }
      }
    });
  }

  if (linkInvalid) {
    return (
      <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-mb-error/10 border border-mb-error/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-mb-error" />
        </div>
        <h1 className="font-serif text-2xl text-mb-text">Este link no es válido</h1>
        {linkInvalid === "oauth" ? (
          <>
            <p className="text-sm text-mb-muted leading-relaxed">
              Esta cuenta usa Google para iniciar sesión y no tiene contraseña que
              restablecer.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full min-h-11 items-center justify-center bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors"
            >
              Iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-mb-muted leading-relaxed">
              Este link para restablecer tu contraseña expiró o no es válido. Pedí uno
              nuevo.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex w-full min-h-11 items-center justify-center bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors"
            >
              Pedir un nuevo link
            </Link>
          </>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-mb-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-mb-success" />
        </div>
        <p className="text-sm text-mb-text leading-relaxed">
          Tu contraseña se actualizó correctamente.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full min-h-11 items-center justify-center bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-[54px] h-[54px] rounded-2xl bg-mb-primary/10 border border-mb-primary/40 flex items-center justify-center">
          <Lock className="w-6 h-6 text-mb-accent" />
        </div>
        <h1 className="font-serif text-2xl text-mb-text">Elegí una nueva contraseña</h1>
        <p className="text-sm text-mb-muted leading-relaxed">
          Tiene que ser distinta a la anterior.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="pw1" className="block text-sm text-mb-muted font-medium">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="pw1"
              type={showPw1 ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={pw1}
              disabled={isPending}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-mb-input border border-mb-border focus:border-mb-primary rounded-xl px-4 pr-11 text-mb-text placeholder:text-mb-dim outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw1((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mb-dim hover:text-mb-muted transition-colors"
              aria-label={showPw1 ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPw1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pw1 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      strength.score >= i ? STRENGTH_COLORS[strength.score] : "bg-mb-border",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-mb-muted">{strength.label}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pw2" className="block text-sm text-mb-muted font-medium">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="pw2"
              type={showPw2 ? "text" : "password"}
              autoComplete="new-password"
              value={pw2}
              disabled={isPending}
              onChange={(e) => {
                setPw2(e.target.value);
                setTouchedPw2(true);
              }}
              placeholder="••••••••"
              className={cn(
                "w-full h-11 bg-mb-input border rounded-xl px-4 pr-11 text-mb-text placeholder:text-mb-dim outline-none transition-colors",
                mismatch ? "border-mb-error" : "border-mb-border focus:border-mb-primary",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw2((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mb-dim hover:text-mb-muted transition-colors"
              aria-label={showPw2 ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mismatch && <p className="text-xs text-mb-error">Las contraseñas no coinciden.</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || !valid}
          className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Guardando…
            </>
          ) : (
            "Guardar nueva contraseña"
          )}
        </button>
      </form>
    </div>
  );
}
