"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFollow, apiFollowSuggestions } from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import { cn } from "@/lib/utils";
import type { FollowSuggestion } from "@/types/api";

interface FollowSuggestionsWidgetProps {
  accessToken: string;
}

export function FollowSuggestionsWidget({ accessToken }: FollowSuggestionsWidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["follow-suggestions"],
    queryFn: () => apiFollowSuggestions(accessToken),
    staleTime: 5 * 60 * 1000,
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const suggestions = (data?.data ?? []).filter((s) => !dismissed.has(s.id));

  function handleFollow(s: FollowSuggestion) {
    startTransition(async () => {
      try {
        const result = await apiFollow(s.handle, accessToken);
        if (result?.data.status === "PENDING") {
          // Private account — request sent but not yet approved, keep the
          // row visible with a "Solicitud enviada" state instead of
          // dismissing it as if the follow had gone through directly.
          setPendingIds((prev) => new Set(prev).add(s.id));
        } else {
          setDismissed((prev) => new Set(prev).add(s.id));
        }
      } catch {
        // No optimistic state was set yet — nothing to revert.
      }
    });
  }

  if (!isLoading && suggestions.length === 0) return null;

  return (
    <section className="bg-mb-card border border-mb-border rounded-xl p-5">
      <h2 className="text-[13px] font-semibold tracking-wide uppercase text-mb-muted mb-4">
        Personas a seguir
      </h2>
      {isLoading ? (
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="w-[38px] h-[38px] rounded-full bg-mb-input shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-mb-input" />
                <div className="h-3 w-1/3 rounded bg-mb-input" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {suggestions.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5">
              {s.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.avatarUrl}
                  alt=""
                  aria-hidden
                  className="w-[38px] h-[38px] rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  aria-hidden
                  className="w-[38px] h-[38px] rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
                >
                  {getInitials(s.displayName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${s.handle}`}
                  className="block text-sm font-medium text-mb-text truncate hover:text-mb-accent"
                >
                  {s.displayName}
                </Link>
                <div className="font-mono text-xs text-mb-muted truncate">@{s.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => handleFollow(s)}
                disabled={isPending || pendingIds.has(s.id)}
                aria-label={
                  pendingIds.has(s.id) ? `Solicitud enviada a ${s.displayName}` : `Seguir a ${s.displayName}`
                }
                className={cn(
                  "shrink-0 min-h-[34px] px-3.5 rounded-full font-semibold text-[13px] transition-colors disabled:cursor-not-allowed cursor-pointer",
                  pendingIds.has(s.id)
                    ? "bg-mb-input border border-mb-border text-mb-muted disabled:opacity-100"
                    : "bg-transparent border border-mb-primary text-mb-accent hover:bg-mb-dp disabled:opacity-60",
                )}
              >
                {pendingIds.has(s.id) ? "Solicitud enviada" : "Seguir"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
