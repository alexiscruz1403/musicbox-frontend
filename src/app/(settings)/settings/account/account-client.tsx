"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { apiExportUserData, apiForgotPassword, ApiError } from "@/lib/api";
import { DeleteAccountModal } from "./delete-account-modal";
import { ChangeEmailModal } from "./change-email-modal";

interface AccountClientProps {
  email: string;
  handle: string;
  accessToken: string;
}

export default function AccountClient({ email, handle, accessToken }: AccountClientProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, startExportTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isPwPending, startPwTransition] = useTransition();
  const router = useRouter();

  function handleChangePassword() {
    setPwError(null);
    startPwTransition(async () => {
      try {
        await apiForgotPassword(email);
        setPwSent(true);
      } catch (err) {
        const apiErr = err as ApiError;
        setPwError(apiErr.message || "No se pudo enviar el email. Intentá de nuevo.");
      }
    });
  }

  function handleExport() {
    setExportError(null);
    startExportTransition(async () => {
      try {
        const { data } = await apiExportUserData(accessToken);
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `musicbox-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const apiErr = err as ApiError;
        setExportError(apiErr.message || "No se pudo exportar tus datos. Intentá de nuevo.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg">
      <header className="md:hidden sticky top-0 z-10 bg-mb-bg/80 backdrop-blur border-b border-mb-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="text-mb-muted hover:text-mb-text transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-mb-text">Cuenta</span>
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
          <h1 className="font-serif text-3xl text-mb-text mb-2">Cuenta</h1>
          <div
            className="w-full h-0.5 rounded-full mt-[18px]"
            style={{
              background: "linear-gradient(90deg, #6B35D4, #C4A8F5, transparent)",
            }}
            aria-hidden
          />
        </div>

        {/* Email */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-3.5">Email</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="email"
              value={email}
              readOnly
              disabled
              aria-label="Email actual"
              className="flex-1 min-w-0 py-4 px-3.5 sm:py-0 sm:h-12 bg-mb-input border border-mb-border rounded-lg text-mb-muted cursor-not-allowed outline-none"
            />
            <button
              type="button"
              onClick={() => setChangeEmailOpen(true)}
              className="shrink-0 min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors"
            >
              Cambiar email
            </button>
          </div>
        </section>

        {/* Password */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-1.5">Contraseña</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-3.5">
            Te enviamos un link para restablecer tu contraseña a tu email actual.
          </p>
          {pwError && (
            <p role="alert" className="text-mb-error text-xs mb-3">
              {pwError}
            </p>
          )}
          {pwSent ? (
            <p role="status" className="text-mb-success text-sm">
              Te enviamos un email a {email} con instrucciones.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isPwPending}
              className="min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors disabled:opacity-60"
            >
              {isPwPending ? "Enviando…" : "Cambiar contraseña"}
            </button>
          )}
        </section>

        {/* Export */}
        <section className="py-7 border-b border-mb-border">
          <h2 className="text-sm font-semibold text-mb-text mb-1.5">Exportar datos</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-3.5">
            Recibirás un archivo JSON con todas tus reseñas, comentarios y datos de perfil.
          </p>
          {exportError && (
            <p role="alert" className="text-mb-error text-xs mb-3">
              {exportError}
            </p>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 min-h-11 px-4 border border-mb-primary rounded-lg text-mb-accent font-medium text-sm hover:bg-mb-dp transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Preparando…" : "Descargar mis datos"}
          </button>
        </section>

        {/* Danger zone */}
        <section className="mt-8 p-6 border border-mb-error/40 rounded-xl bg-mb-error/[0.03]">
          <h2 className="text-sm font-semibold text-mb-error mb-1.5">Zona peligrosa</h2>
          <p className="text-[13px] text-mb-muted leading-relaxed mb-4">
            Eliminar tu cuenta es permanente. No vas a poder recuperar tus datos.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="min-h-11 px-4.5 border border-mb-error rounded-lg text-mb-error font-semibold text-sm hover:bg-mb-error/10 transition-colors"
          >
            Eliminar mi cuenta
          </button>
        </section>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          accessToken={accessToken}
          handle={handle}
        />
      )}

      {changeEmailOpen && (
        <ChangeEmailModal
          open={changeEmailOpen}
          onClose={() => setChangeEmailOpen(false)}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
