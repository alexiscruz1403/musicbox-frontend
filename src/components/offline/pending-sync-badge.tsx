"use client";

import { CloudUpload } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePendingMutationCount } from "@/hooks/use-pending-mutation-count";
import { cn } from "@/lib/utils";

interface PendingSyncBadgeProps {
  className?: string;
}

// Indicador visible de mutaciones offline encoladas que todavía no se
// sincronizaron con el backend — evita que el usuario piense que perdió una
// reseña/edición hecha sin conexión.
export function PendingSyncBadge({ className }: PendingSyncBadgeProps) {
  const count = usePendingMutationCount();
  const t = useTranslations("Offline");

  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-mb-accent",
        className,
      )}
      role="status"
    >
      <CloudUpload className="w-3.5 h-3.5 shrink-0" />
      {t("pendingSyncBadge", { count })}
    </span>
  );
}
