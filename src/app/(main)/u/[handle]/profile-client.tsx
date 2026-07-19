"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { UserCheck, UserPlus, Clock, Pencil, Flag, Settings, Lock, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiFollow, apiUnfollow, apiUserReviews } from "@/lib/api";
import { useOfflineListQuery } from "@/hooks/use-offline-list-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getInitials } from "@/lib/review-format";
import { ProfileReviewCard } from "@/components/reviews/profile-review-card";
import { ReportModal } from "@/components/reports/report-modal";
import { FollowListDrawer } from "@/components/profile/follow-list-drawer";
import type { PublicProfileResponse, UserReviewHistoryItem } from "@/types/api";

type Tab = "todo" | "albums" | "songs";
type ReviewSort = "recent" | "oldest" | "best" | "worst";

interface ProfileClientProps {
  profile: PublicProfileResponse;
  isOwnProfile: boolean;
  currentUserHandle?: string;
  accessToken?: string;
}

function StatItem({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="block text-lg font-bold text-mb-text">{value}</span>
      <span className="block text-xs text-mb-muted">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-center bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return <div className="text-center">{content}</div>;
}

export default function ProfileClient({
  profile,
  isOwnProfile,
  currentUserHandle,
  accessToken,
}: ProfileClientProps) {
  const t = useTranslations("PublicProfile");
  const tCommon = useTranslations("Common");
  const SORT_OPTIONS: { id: ReviewSort; label: string }[] = [
    { id: "recent", label: t("sortRecent") },
    { id: "oldest", label: t("sortOldest") },
    { id: "best", label: t("sortBest") },
    { id: "worst", label: t("sortWorst") },
  ];
  const [isFollowing, setIsFollowing] = useState(
    profile.isFollowing ?? false,
  );
  const [requestSent, setRequestSent] = useState(
    profile.followRequestPending ?? false,
  );
  const [followerCount, setFollowerCount] = useState(
    profile.stats.followersCount,
  );
  const [activeTab, setActiveTab] = useState<Tab>("todo");
  const [reportOpen, setReportOpen] = useState(false);
  const [followListKind, setFollowListKind] = useState<"followers" | "following" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const [reviewQuery, setReviewQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { user, stats } = profile;
  const locked = !isOwnProfile && user.isPrivate && !isFollowing;
  const debouncedReviewQuery = useDebouncedValue(reviewQuery.trim(), 350);

  const {
    items: reviewItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: reviewsLoading,
  } = useOfflineListQuery({
    queryKey: ["user-reviews", user.handle, reviewSort, debouncedReviewQuery],
    cacheKey: `user-reviews:${user.handle}:${reviewSort}:${debouncedReviewQuery}`,
    fetchPage: async (cursor) => {
      const { data } = await apiUserReviews(
        user.handle,
        cursor,
        accessToken,
        reviewSort,
        debouncedReviewQuery || undefined,
      );
      return data;
    },
    enabled: !locked,
  });
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
    if (reviewsLoading && reviewItems.length === 0) {
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
              aria-label={t("loadingMoreReviewsAriaLabel")}
            />
          )}
        </div>
      </>
    );
  }

  function handleFollowToggle() {
    if (!accessToken) return;

    // Already following, or already have a pending request out — either way
    // the click cancels (DELETE handles both: unfollow, or cancel a pending
    // outgoing FollowRequest).
    if (isFollowing || requestSent) {
      const wasFollowing = isFollowing;
      setIsFollowing(false);
      setRequestSent(false);
      if (wasFollowing) setFollowerCount((c) => c - 1);
      startTransition(async () => {
        try {
          await apiUnfollow(user.handle, accessToken);
        } catch {
          if (wasFollowing) {
            setIsFollowing(true);
            setFollowerCount((c) => c + 1);
          } else {
            setRequestSent(true);
          }
        }
      });
      return;
    }

    // Not following, no pending request — attempt to follow. A private
    // target responds 201 { status: "PENDING" } instead of a direct 204.
    startTransition(async () => {
      try {
        const result = await apiFollow(user.handle, accessToken);
        if (result?.data.status === "PENDING") {
          setRequestSent(true);
        } else {
          setIsFollowing(true);
          setFollowerCount((c) => c + 1);
        }
      } catch {
        // no optimistic state was set — nothing to revert
      }
    });
  }

  return (
    <div className="min-h-screen bg-mb-bg">
      {/* Cover */}
      <div className="h-[160px] md:h-[240px] w-full overflow-hidden border-b border-mb-border">
        {user.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.coverUrl}
            alt={t("coverAlt", { name: user.displayName })}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #1E0A3C 0%, #0A0A0F 100%), radial-gradient(ellipse at 50% 100%, #6B35D4 0%, transparent 60%)",
            }}
            aria-hidden
          />
        )}
      </div>

      <div className="px-4 md:px-8 max-w-3xl mx-auto">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={t("avatarAlt", { name: user.displayName })}
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
                aria-label={t("reportUserAriaLabel")}
                title={t("reportUserAriaLabel")}
                className="flex items-center justify-center w-9 h-9 bg-mb-input border border-mb-border rounded-lg text-mb-muted hover:border-mb-error hover:text-mb-error transition-colors cursor-pointer"
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
                  {t("editProfileLink")}
                </Link>
                <Link
                  href="/settings"
                  aria-label={t("settingsAriaLabel")}
                  title={t("settingsAriaLabel")}
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
                  "flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed",
                  isFollowing || requestSent
                    ? "bg-mb-input border border-mb-border text-mb-text hover:border-mb-error hover:text-mb-error"
                    : "bg-mb-primary hover:bg-mb-primary-h text-white",
                )}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    {tCommon("following")}
                  </>
                ) : requestSent ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    {t("requestSentLabel")}
                  </>
                ) : user.isPrivate ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    {t("requestFollowLabel")}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    {tCommon("follow")}
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 h-9 bg-mb-primary hover:bg-mb-primary-h rounded-lg text-sm font-semibold text-white transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {tCommon("follow")}
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
          <StatItem value={stats.reviewCount} label={t("statsReviews")} />
          <div className="w-px h-8 bg-mb-border" />
          <StatItem
            value={followerCount}
            label={t("statsFollowers")}
            onClick={!locked ? () => setFollowListKind("followers") : undefined}
          />
          <div className="w-px h-8 bg-mb-border" />
          <StatItem
            value={stats.followingCount}
            label={t("statsFollowing")}
            onClick={!locked ? () => setFollowListKind("following") : undefined}
          />
        </div>

        {locked ? (
          /* Perfil privado, viewer aún no aprobado */
          <div className="flex flex-col items-center text-center px-6 py-16 bg-mb-card border border-mb-border rounded-xl mb-24">
            <div className="w-14 h-14 rounded-full bg-mb-input border border-mb-border flex items-center justify-center mb-5">
              <Lock className="w-6 h-6 text-mb-dim" />
            </div>
            <h2 className="font-serif text-xl text-mb-text mb-2">{t("privateAccountHeading")}</h2>
            <p className="text-sm text-mb-muted leading-relaxed max-w-xs">
              {t("privateAccountBefore")} <span className="font-mono text-mb-accent">@{user.handle}</span>{" "}
              {t("privateAccountAfter")}
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-mb-border mb-6">
              <div className="flex gap-0">
                {(
                  [
                    { id: "todo" as Tab, label: t("tabAll") },
                    { id: "albums" as Tab, label: t("tabAlbums") },
                    { id: "songs" as Tab, label: t("tabTracks") },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
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

            {/* Sort + search controls */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mb-dim pointer-events-none"
                  aria-hidden
                />
                <input
                  type="text"
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  aria-label={t("searchReviewsAriaLabel")}
                  placeholder={t("searchReviewsPlaceholder")}
                  className="w-full h-10 pl-9 pr-3 bg-mb-input border border-mb-border rounded-lg text-mb-text text-sm placeholder:text-mb-dim outline-none focus:border-mb-primary transition-colors"
                />
              </div>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                aria-label={t("sortReviewsAriaLabel")}
                className="h-10 px-3 bg-mb-input border border-mb-border rounded-lg text-mb-text text-sm cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab content */}
            {activeTab === "todo" &&
              renderReviewList(
                reviewItems,
                debouncedReviewQuery
                  ? t("noReviewsMatchQuery", { query: debouncedReviewQuery })
                  : t("noReviewsAtAll"),
              )}
            {activeTab === "albums" &&
              renderReviewList(
                albumItems,
                debouncedReviewQuery
                  ? t("noReviewsMatchQuery", { query: debouncedReviewQuery })
                  : t("noAlbumReviews"),
              )}
            {activeTab === "songs" &&
              renderReviewList(
                songItems,
                debouncedReviewQuery
                  ? t("noReviewsMatchQuery", { query: debouncedReviewQuery })
                  : t("noTrackReviews"),
              )}
          </>
        )}
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

      {followListKind && (
        <FollowListDrawer
          open
          kind={followListKind}
          handle={user.handle}
          currentUserHandle={currentUserHandle}
          accessToken={accessToken}
          onClose={() => setFollowListKind(null)}
        />
      )}
    </div>
  );
}
