"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiForgotPassword, type ApiError } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function send() {
    setGlobalError(null);
    if (email.trim().length === 0) {
      setFieldError("Ingresá tu email.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldError("Ese email no parece válido.");
      return;
    }
    setFieldError(null);
    startTransition(async () => {
      try {
        await apiForgotPassword(email.trim());
        setSent(true);
      } catch (err) {
        const apiErr = err as ApiError;
        setGlobalError(apiErr.message || "Ocurrió un error. Intentá de nuevo.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <div className="w-full max-w-[400px] bg-mb-card border border-mb-border rounded-2xl p-8 space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-mb-muted hover:text-mb-text transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a iniciar sesión
      </Link>

      {!sent ? (
        <>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-[54px] h-[54px] rounded-2xl bg-mb-primary/10 border border-mb-primary/40 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-mb-accent" />
            </div>
            <h1 className="font-serif text-2xl text-mb-text">¿Olvidaste tu contraseña?</h1>
            <p className="text-sm text-mb-muted leading-relaxed">
              Ingresá tu email y te mandamos un link para restablecerla.
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
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-mb-muted font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                disabled={isPending}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                placeholder="vos@ejemplo.com"
                className={cn(
                  "w-full h-11 bg-mb-input border rounded-xl px-4 text-mb-text placeholder:text-mb-dim outline-none transition-colors",
                  fieldError ? "border-mb-error" : "border-mb-border focus:border-mb-primary",
                )}
              />
              {fieldError && <p className="text-xs text-mb-error">{fieldError}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-mb-primary hover:bg-mb-primary-h rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Enviando…
                </>
              ) : (
                "Enviar link de recuperación"
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-mb-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-mb-success" />
          </div>
          <p className="text-sm text-mb-text leading-relaxed">
            Si <span className="font-mono text-mb-accent">{email}</span> está registrado, vas a
            recibir un email con instrucciones en unos minutos.
          </p>
          <p className="text-xs text-mb-dim">Revisá también la carpeta de spam.</p>
          <button
            type="button"
            onClick={send}
            disabled={isPending}
            className="min-h-11 px-5 bg-transparent border border-mb-primary rounded-xl text-mb-accent font-medium text-sm hover:bg-mb-primary/10 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Enviando…" : "Enviar de nuevo"}
          </button>
        </div>
      )}
    </div>
  );
}
