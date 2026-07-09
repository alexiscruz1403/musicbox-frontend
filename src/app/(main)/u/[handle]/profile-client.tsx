"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { UserCheck, UserPlus, Pencil, Flag, Settings } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiFollow, apiUnfollow, apiUserReviews } from "@/lib/api";
import { getInitials } from "@/lib/review-format";
import { ProfileReviewCard } from "@/components/reviews/profile-review-card";
import { ReportModal } from "@/components/reports/report-modal";
import type { PublicProfileResponse, UserReviewHistoryItem } from "@/types/api";

type Tab = "todo" | "albums" | "songs";

interface ProfileClientProps {
  profile: PublicProfileResponse;
  isOwnProfile: boolean;
  currentUserHandle?: string;
  accessToken?: string;
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="block text-lg font-bold text-mb-text">{value}</span>
      <span className="block text-xs text-mb-muted">{label}</span>
    </div>
  );
}

export default function ProfileClient({
  profile,
  isOwnProfile,
  currentUserHandle: _currentUserHandle,
  accessToken,
}: ProfileClientProps) {
  const [isFollowing, setIsFollowing] = useState(
    profile.isFollowing ?? false,
  );
  const [followerCount, setFollowerCount] = useState(
    profile.stats.followersCount,
  );
  const [activeTab, setActiveTab] = useState<Tab>("todo");
  const [reportOpen, setReportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { user, stats } = profile;

  const {
    data: reviewPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: reviewsFetching,
  } = useInfiniteQuery({
    queryKey: ["user-reviews", user.handle],
    queryFn: ({ pageParam }) => apiUserReviews(user.handle, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  });

  const reviewItems = (reviewPages?.pages ?? []).flatMap((p) => p.data.items);
  const albumItems = reviewItems.filter((item) => item.type === "ALBUM");
  const songItems = reviewItems.filter((item) => item.type === "TRACK");

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function renderReviewList(items: UserReviewHistoryItem[], emptyMessage: string) {
    if (reviewsFetching && reviewItems.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-mb-card border border-mb-border rounded-xl"
            />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-mb-muted text-sm">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <>
        <div className="space-y-3 pb-6">
          {items.map((item) => (
            <ProfileReviewCard key={item.id} item={item} />
          ))}
        </div>
        <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
          {isFetchingNextPage && (
            <div
              className="w-5 h-5 rounded-full border-2 border-mb-primary border-t-transparent animate-spin"
              aria-label="Cargando más reseñas"
            />
          )}
        </div>
      </>
    );
  }

  function handleFollowToggle() {
    if (!accessToken) return;
    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    setFollowerCount((c) => c + (willFollow ? 1 : -1));
    startTransition(async () => {
      try {
        if (willFollow) {
          await apiFollow(user.handle, accessToken);
        } else {
          await apiUnfollow(user.handle, accessToken);
        }
      } catch {
        setIsFollowing(!willFollow);
        setFollowerCount((c) => c + (willFollow ? -1 : 1));
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg">
      {/* Cover */}
      <div
        className="h-[120px] w-full"
        style={{
          background:
            "linear-gradient(135deg, #1E0A3C 0%, #0A0A0F 100%), radial-gradient(ellipse at 50% 100%, #6B35D4 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="px-4 md:px-8 max-w-3xl mx-auto">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={`Avatar de ${user.displayName}`}
                className="w-20 h-20 rounded-full border-4 border-mb-bg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-mb-bg bg-mb-ddp flex items-center justify-center text-mb-accent text-xl font-bold">
                {getInitials(user.displayName)}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mb-1 flex items-center gap-2">
            {!isOwnProfile && accessToken && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                aria-label="Reportar usuario"
                title="Reportar usuario"
                className="flex items-center justify-center w-9 h-9 bg-mb-input border border-mb-border rounded-lg text-mb-muted hover:border-mb-error hover:text-mb-error transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
            {isOwnProfile ? (
              <>
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 px-4 h-9 bg-mb-input border border-mb-border rounded-lg text-sm font-medium text-mb-text hover:border-mb-primary/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar perfil
                </Link>
                <Link
                  href="/settings"
                  aria-label="Configuración"
                  title="Configuración"
                  className="md:hidden flex items-center justify-center w-9 h-9 bg-mb-input border border-mb-border rounded-lg text-mb-muted hover:border-mb-primary/50 hover:text-mb-text transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : accessToken ? (
              <button
                onClick={handleFollowToggle}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70",
                  isFollowing
                    ? "bg-mb-input border border-mb-border text-mb-text hover:border-mb-error hover:text-mb-error"
                    : "bg-mb-primary hover:bg-mb-primary-h text-white",
                )}
              >
                {isFollowing ? (
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
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 h-9 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-sm font-semibold text-white transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Seguir
              </Link>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-1 mb-4">
          <h1 className="font-serif text-2xl text-mb-text">
            {user.displayName}
          </h1>
          <p className="font-mono text-sm text-mb-muted">@{user.handle}</p>
          {user.bio && (
            <p className="text-sm text-mb-muted mt-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6">
          <StatItem value={stats.reviewCount} label="reseñas" />
          <div className="w-px h-8 bg-mb-border" />
          <StatItem value={followerCount} label="seguidores" />
          <div className="w-px h-8 bg-mb-border" />
          <StatItem value={stats.followingCount} label="siguiendo" />
        </div>

        {/* Tabs */}
        <div className="border-b border-mb-border mb-6">
          <div className="flex gap-0">
            {(
              [
                { id: "todo" as Tab, label: "Todo" },
                { id: "albums" as Tab, label: "Álbumes" },
                { id: "songs" as Tab, label: "Canciones" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === id
                    ? "border-mb-primary text-mb-accent"
                    : "border-transparent text-mb-muted hover:text-mb-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "todo" &&
          renderReviewList(reviewItems, "Todavía no hay reseñas. ¡Sé el primero en compartir!")}
        {activeTab === "albums" &&
          renderReviewList(albumItems, "Todavía no hay reseñas de álbumes.")}
        {activeTab === "songs" &&
          renderReviewList(songItems, "Todavía no hay reseñas de canciones.")}
      </div>

      {reportOpen && accessToken && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          accessToken={accessToken}
          targetType="USER"
          targetId={user.id}
          previewTitle={`@${user.handle}`}
        />
      )}
    </div>
  );
}
