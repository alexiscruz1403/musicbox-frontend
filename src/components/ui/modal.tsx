"use client";

import { useEffect, type ReactNode } from "react";

// Primitivo compartido para los overlays "backdrop envuelve panel" del
// proyecto (ReportModal, DeleteAccountModal, ChangeEmailModal, el confirm
// dialog de admin-reports-client.tsx, FollowListDrawer) — centraliza el
// listener de Escape y el patrón onClick-en-backdrop + stopPropagation-en-panel
// que esos 5 componentes reimplementaban cada uno por su cuenta, byte a byte
// iguales en la mayoría de los casos. Sin dependencia nueva (sin Radix
// Dialog) — mismo criterio que el resto del proyecto de evitar una
// dependencia para una superficie chica y predecible (ver
// docs/musicbox-frontend-guide.md §12, decisión del refactor).
//
// `NotificationsPanel` NO usa este primitivo: su backdrop y su panel son
// hermanos (no anidados) y en mobile no hay backdrop clickeable — un shape de
// interacción genuinamente distinto, no solo un estilo distinto.

const DEFAULT_BACKDROP_CLASS =
  "fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto cursor-pointer";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** "alertdialog" para confirmaciones destructivas (ver WAI-ARIA). */
  role?: "dialog" | "alertdialog";
  /** Clases del div de fondo — default: modal centrado / bottom-sheet en mobile. */
  backdropClassName?: string;
  /** Clases del panel — cada caller define su propio ancho/alto/radios. */
  panelClassName: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  ariaLabel,
  role = "dialog",
  backdropClassName = DEFAULT_BACKDROP_CLASS,
  panelClassName,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div onClick={onClose} className={backdropClassName}>
      <div
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        className={panelClassName}
      >
        {children}
      </div>
    </div>
  );
}
