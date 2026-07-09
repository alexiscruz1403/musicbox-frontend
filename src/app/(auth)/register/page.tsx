"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRegister, apiCheckHandle, generateIdempotencyKey, type ApiError } from "@/lib/api";
import { getPasswordStrength, STRENGTH_COLORS } from "@/lib/password-strength";

type HandleStatus = "idle" | "short" | "invalid" | "checking" | "available" | "taken";

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const idempotencyKey = useRef(generateIdempotencyKey());
  const router = useRouter();
  const passwordId = useId();

  const strength = getPasswordStrength(password);

  // Debounced handle check
  useEffect(() => {
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
        const { data } = await apiCheckHandle(handle);
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
  }, [handle]);

  function handleGoogleSignIn() {
    startTransition(async () => {
      await signIn("google", { callbackUrl: "/feed" });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    if (!terms) {
      setGlobalError("Debés aceptar los términos y condiciones.");
      return;
    }
    if (handleStatus === "taken") {
      setFieldErrors((p) => ({ ...p, handle: "Este handle ya está en uso." }));
      return;
    }
    if (handleStatus === "invalid" || handleStatus === "short") {
      setFieldErrors((p) => ({
        ...p,
        handle: "Handle inválido. Usá letras, números o _. Mínimo 3 caracteres.",
      }));
      return;
    }

    startTransition(async () => {
      try {
        await apiRegister({
          handle,
          displayName,
          email,
          password,
          consent: true,
          idempotencyKey: idempotencyKey.current,
        });
        // Sign in after successful registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          router.push("/login");
        } else {
          router.push("/feed");
          router.refresh();
        }
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "HANDLE_TAKEN") {
          setFieldErrors((p) => ({
            ...p,
            handle: "Este handle ya está en uso.",
          }));
          setHandleStatus("taken");
        } else if (apiErr.code === "EMAIL_TAKEN") {
          setFieldErrors((p) => ({
            ...p,
            email: "Este email ya está registrado.",
          }));
        } else {
          setGlobalError(apiErr.message ?? "Ocurrió un error. Intentá de nuevo.");
        }
      }
    });
  }

  return (
    <div className="w-full max-w-[440px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-6 my-4">
      {/* Logo */}
      <div className="text-center space-y-1">
        <div className="text-3xl" aria-hidden>
          🎵
        </div>
        <h1 className="font-serif text-2xl text-mb-text">MusicBox</h1>
      </div>

      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl text-mb-text">Crea tu cuenta</h2>
        <p className="text-mb-muted text-sm">
          Compartí tu amor por la música.
        </p>
      </div>

      {globalError && (
        <div
          role="alert"
          className="bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
        >
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display name */}
        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-sm text-mb-muted font-medium"
          >
            ¿Cómo te llamamos?
          </label>
          <input
            id="displayName"
            type="text"
            required
            maxLength={50}
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full h-11 bg-mb-input border border-mb-border focus:border-mb-primary rounded-xl px-4 text-mb-text placeholder:text-mb-dim outline-none transition-colors"
          />
        </div>

        {/* Handle */}
        <div className="space-y-1.5">
          <label
            htmlFor="handle"
            className="block text-sm text-mb-muted font-medium"
          >
            Tu handle
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
              autoComplete="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="tu_handle"
              className={cn(
                "w-full h-11 bg-mb-input border rounded-xl pl-8 pr-10 font-mono text-sm text-mb-text placeholder:text-mb-dim outline-none transition-colors",
                fieldErrors.handle || handleStatus === "taken" || handleStatus === "invalid"
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
          {fieldErrors.handle ? (
            <p className="text-xs text-mb-error">{fieldErrors.handle}</p>
          ) : handleStatus === "taken" ? (
            <p className="text-xs text-mb-error">Este handle ya está en uso.</p>
          ) : handleStatus === "available" ? (
            <p className="text-xs text-mb-success">¡Handle disponible!</p>
          ) : handleStatus === "short" ? (
            <p className="text-xs text-mb-dim">Mínimo 3 caracteres.</p>
          ) : handleStatus === "invalid" ? (
            <p className="text-xs text-mb-error">
              Solo letras, números y guion bajo.
            </p>
          ) : null}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm text-mb-muted font-medium"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={cn(
              "w-full h-11 bg-mb-input border rounded-xl px-4 text-mb-text placeholder:text-mb-dim outline-none transition-colors",
              fieldErrors.email
                ? "border-mb-error"
                : "border-mb-border focus:border-mb-primary",
            )}
          />
          {fieldErrors.email && (
            <p className="text-xs text-mb-error">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor={passwordId}
            className="block text-sm text-mb-muted font-medium"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full h-11 bg-mb-input border border-mb-border focus:border-mb-primary rounded-xl px-4 pr-11 text-mb-text placeholder:text-mb-dim outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mb-dim hover:text-mb-muted transition-colors"
              aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      strength.score >= i
                        ? STRENGTH_COLORS[strength.score]
                        : "bg-mb-border",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-mb-muted">{strength.label}</p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={terms}
            onClick={() => setTerms((v) => !v)}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
              terms
                ? "bg-mb-primary border-mb-primary"
                : "bg-mb-input border-mb-border hover:border-mb-primary/50",
            )}
          >
            {terms && (
              <svg
                viewBox="0 0 12 10"
                className="w-3 h-3 fill-none stroke-white stroke-[2]"
                aria-hidden="true"
              >
                <polyline points="1,5 4,8 11,1" />
              </svg>
            )}
          </button>
          <span className="text-sm text-mb-muted leading-snug">
            Acepto los{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mb-accent hover:text-mb-primary-h transition-colors"
            >
              términos de servicio
            </a>{" "}
            y la{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mb-accent hover:text-mb-primary-h transition-colors"
            >
              política de privacidad
            </a>
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending || handleStatus === "taken" || handleStatus === "checking"}
          className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
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
              Creando cuenta…
            </>
          ) : (
            "Crear cuenta"
          )}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-mb-border" />
        <span className="text-mb-dim text-xs whitespace-nowrap">
          o continúa con Google
        </span>
        <div className="flex-1 h-px bg-mb-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-3 bg-mb-input border border-mb-border rounded-xl h-11 text-mb-text text-sm font-medium hover:border-mb-primary/50 transition-colors disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuar con Google
      </button>

      <p className="text-center text-sm text-mb-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="text-mb-accent hover:text-mb-primary-h transition-colors font-medium"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
