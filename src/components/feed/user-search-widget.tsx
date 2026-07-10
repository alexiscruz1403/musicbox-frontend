"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, X, UserCheck, UserPlus } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiFollow, apiUnfollow, apiSearchUsers } from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import type { UserSearchResult } from "@/types/api";

interface UserSearchWidgetProps {
  accessToken: string;
}

export function UserSearchWidget({ accessToken }: UserSearchWidgetProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const searchEnabled = debouncedQuery.length >= 2;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["user-search", debouncedQuery],
    queryFn: ({ pageParam }) =>
      apiSearchUsers(debouncedQuery, pageParam as string | undefined, 10, accessToken),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: searchEnabled,
    staleTime: 30 * 1000,
  });

  const results = (data?.pages ?? []).flatMap((p) => p.data.items);
  const isLoading = isFetching && results.length === 0;

  function isFollowing(item: UserSearchResult) {
    return followOverrides[item.id] ?? item.isFollowing;
  }

  function handleToggleFollow(item: UserSearchResult) {
    const next = !isFollowing(item);
    setFollowOverrides((prev) => ({ ...prev, [item.id]: next }));
    startTransition(async () => {
      try {
        if (next) {
          await apiFollow(item.handle, accessToken);
        } else {
          await apiUnfollow(item.handle, accessToken);
        }
      } catch {
        setFollowOverrides((prev) => ({ ...prev, [item.id]: !next }));
      }
    });
  }

  return (
    <section className="mb-7">
      <div
        className={cn(
          "flex items-center gap-3 bg-mb-input border border-mb-border rounded-lg px-4 transition-all",
          "focus-within:border-mb-primary focus-within:shadow-[0_0_0_1px_var(--color-mb-primary)]",
        )}
      >
        <Search className="w-5 h-5 text-mb-muted shrink-0" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar usuarios"
          placeholder="Buscá usuarios por nombre o @handle…"
          className="flex-1 min-w-0 h-12 bg-transparent border-none outline-none text-mb-text text-[15px] placeholder:text-mb-dim"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="w-7 h-7 flex items-center justify-center bg-mb-border rounded-full text-mb-muted hover:bg-mb-ddp hover:text-mb-text transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {searchEnabled && (
        <div className="mt-3 bg-mb-card border border-mb-border rounded-xl p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-mb-input shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 rounded bg-mb-input" />
                    <div className="h-3 w-1/3 rounded bg-mb-input" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-mb-muted text-sm text-center py-2">
              No encontramos usuarios para &ldquo;{debouncedQuery}&rdquo;.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {results.map((u) => {
                const following = isFollowing(u);
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <Link href={`/u/${u.handle}`} className="contents">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt=""
                          aria-hidden
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="w-9 h-9 rounded-full bg-mb-dp flex items-center justify-center text-xs font-semibold text-mb-accent shrink-0"
                        >
                          {getInitials(u.displayName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-mb-text truncate hover:text-mb-accent">
                          {u.displayName}
                        </div>
                        <div className="font-mono text-xs text-mb-muted truncate">@{u.handle}</div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(u)}
                      disabled={isPending}
                      aria-label={following ? `Dejar de seguir a ${u.displayName}` : `Seguir a ${u.displayName}`}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 min-h-[34px] px-3.5 rounded-full font-semibold text-[13px] transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed",
                        following
                          ? "bg-mb-dp border border-mb-ddp text-mb-muted hover:border-mb-error hover:text-mb-error"
                          : "bg-transparent border border-mb-primary text-mb-accent hover:bg-mb-dp",
                      )}
                    >
                      {following ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          Siguiendo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Seguir
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mt-1 h-9 text-sm font-medium text-mb-accent hover:underline disabled:opacity-60 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage ? "Cargando…" : "Cargar más resultados"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
