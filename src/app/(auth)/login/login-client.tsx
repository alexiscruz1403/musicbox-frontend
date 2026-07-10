"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/feed";

  function handleGoogleSignIn() {
    startTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email o contraseña incorrectos.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-6">
      {/* Logo */}
      <div className="text-center space-y-1">
        <div className="text-3xl" aria-hidden>
          🎵
        </div>
        <h1 className="font-serif text-2xl text-mb-text">MusicBox</h1>
      </div>

      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl text-mb-text">
          Bienvenido de vuelta
        </h2>
        <p className="text-mb-muted text-sm">Tu historial musical te espera.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-mb-error/10 border border-mb-error rounded-lg px-4 py-3 text-mb-error text-sm"
        >
          {error}
        </div>
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-3 bg-mb-input border border-mb-border rounded-xl h-11 text-mb-text text-sm font-medium hover:border-mb-primary/50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-mb-border" />
        <span className="text-mb-dim text-xs whitespace-nowrap">
          o continúa con tu email
        </span>
        <div className="flex-1 h-px bg-mb-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={cn(
              "w-full h-11 bg-mb-input border rounded-xl px-4 text-mb-text placeholder:text-mb-dim outline-none transition-colors",
              error
                ? "border-mb-error"
                : "border-mb-border focus:border-mb-primary",
            )}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm text-mb-muted font-medium"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "w-full h-11 bg-mb-input border rounded-xl px-4 pr-11 text-mb-text placeholder:text-mb-dim outline-none transition-colors",
                error
                  ? "border-mb-error"
                  : "border-mb-border focus:border-mb-primary",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mb-dim hover:text-mb-muted transition-colors cursor-pointer"
              aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-mb-accent hover:text-mb-primary-h transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-mb-muted">
        ¿No tenés cuenta?{" "}
        <Link
          href="/register"
          className="text-mb-accent hover:text-mb-primary-h transition-colors font-medium"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
