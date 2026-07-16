"use client";

import { cn } from "@/lib/utils";
import type { FollowStatus } from "@/lib/follow-status";

interface FollowButtonProps {
  status: FollowStatus;
  isPrivate?: boolean;
  displayName: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

export function FollowButton({
  status,
  isPrivate = false,
  displayName,
  disabled,
  onClick,
  className,
}: FollowButtonProps) {
  const label =
    status === "following"
      ? "Siguiendo"
      : status === "pending"
        ? "Solicitado"
        : isPrivate
          ? "Solicitar"
          : "Seguir";

  const ariaLabel =
    status === "following"
      ? `Dejar de seguir a ${displayName}`
      : status === "pending"
        ? `Cancelar solicitud a ${displayName}`
        : isPrivate
          ? `Solicitar seguir a ${displayName}`
          : `Seguir a ${displayName}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 inline-flex items-center justify-center min-h-9 px-3.5 rounded-lg font-semibold text-[12.5px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        status === "following"
          ? "bg-transparent border border-mb-primary text-mb-accent"
          : status === "pending"
            ? "bg-transparent border border-mb-border text-mb-muted"
            : "bg-mb-primary border-none text-white hover:bg-mb-primary-h",
        className,
      )}
    >
      {label}
    </button>
  );
}
