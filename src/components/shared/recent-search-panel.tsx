"use client";

import { Clock, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface RecentSearchRow {
  id: string;
  label: string;
  searchedAt: string;
}

interface RecentSearchPanelProps {
  title?: string;
  items: RecentSearchRow[];
  isLoading: boolean;
  emptyLabel: string;
  onSelect: (item: RecentSearchRow) => void;
  onDeleteOne: (id: string) => void;
  onDeleteAll: () => void;
}

export function RecentSearchPanel({
  title,
  items,
  isLoading,
  emptyLabel,
  onSelect,
  onDeleteOne,
  onDeleteAll,
}: RecentSearchPanelProps) {
  const t = useTranslations("Common");
  const heading = title ?? t("recentSearches");

  return (
    <div>
      <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-mb-dim">
          {heading}
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onDeleteAll}
            className="text-xs font-medium text-mb-accent cursor-pointer hover:underline"
          >
            {t("clearAllSearches")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 px-2 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-mb-input animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-2 py-2 text-[13px] text-mb-dim">{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-mb-input"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex flex-1 min-w-0 items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
            >
              <Clock className="w-3.5 h-3.5 text-mb-dim shrink-0" aria-hidden />
              <span className="flex-1 min-w-0 truncate text-sm text-mb-text">
                {item.label}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteOne(item.id)}
              aria-label={t("removeFromRecent")}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-mb-dim opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-mb-ddp hover:text-mb-text transition-opacity cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
