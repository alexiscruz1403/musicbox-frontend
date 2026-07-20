"use client";

import { useTranslations } from "next-intl";
import { UserCheck, UserPlus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FollowStatus } from "@/lib/follow-status";

interface FollowButtonProps {
  status: FollowStatus;
  isPrivate?: boolean;
  displayName: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
  /** Ícono a la izquierda del label — apagado por default (drawer y búsqueda no lo usan). */
  showIcon?: boolean;
  /**
   * "danger-on-follow": following/pending comparten un único estilo neutro
   * que se pone rojo en hover (sugiere "dejar de seguir"/"cancelar
   * solicitud") — usado en la página de perfil (/u/[handle]). Default:
   * estilos distintos para following vs pending, sin hover rojo — usado por
   * FollowListDrawer y UserSearchWidget.
   */
  variant?: "default" | "danger-on-follow";
}

export function FollowButton({
  status,
  isPrivate = false,
  displayName,
  disabled,
  onClick,
  className,
  showIcon = false,
  variant = "default",
}: FollowButtonProps) {
  const t = useTranslations("Common");

  const label =
    status === "following"
      ? t("following")
      : status === "pending"
        ? t("pending")
        : isPrivate
          ? t("requestFollow")
          : t("follow");

  const ariaLabel =
    status === "following"
      ? t("unfollowAriaLabel", { name: displayName })
      : status === "pending"
        ? t("cancelRequestAriaLabel", { name: displayName })
        : isPrivate
          ? t("requestFollowAriaLabel", { name: displayName })
          : t("followAriaLabel", { name: displayName });

  const Icon = status === "following" ? UserCheck : status === "pending" ? Clock : UserPlus;

  const stateClassName =
    variant === "danger-on-follow"
      ? status === "not_following"
        ? "bg-mb-primary border-none text-white hover:bg-mb-primary-h"
        : "bg-mb-input border border-mb-border text-mb-text hover:border-mb-error hover:text-mb-error"
      : status === "following"
        ? "bg-transparent border border-mb-primary text-mb-accent"
        : status === "pending"
          ? "bg-transparent border border-mb-border text-mb-muted"
          : "bg-mb-primary border-none text-white hover:bg-mb-primary-h";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 inline-flex items-center justify-center min-h-9 px-3.5 rounded-lg font-semibold text-[12.5px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        stateClassName,
        className,
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
