"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { UserCheck, UserPlus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFollow, apiUnfollow } from "@/lib/api";
import type { PublicProfileResponse } from "@/types/api";

type Tab = "reviews" | "albums" | "songs";

interface ProfileClientProps {
  profile: PublicProfileResponse;
  isOwnProfile: boolean;
  currentUserHandle?: string;
  accessToken?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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
  const [activeTab, setActiveTab] = useState<Tab>("reviews");
  const [isPending, startTransition] = useTransition();

  const { user, stats } = profile;

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
          <div className="mb-1">
            {isOwnProfile ? (
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-4 h-9 bg-mb-input border border-mb-border rounded-lg text-sm font-medium text-mb-text hover:border-mb-primary/50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar perfil
              </Link>
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
                { id: "reviews" as Tab, label: "Reseñas" },
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

        {/* Tab content — all empty in Fase 1 */}
        <div className="py-12 text-center space-y-2">
          <p className="text-mb-muted text-sm">
            {activeTab === "reviews" &&
              "Todavía no hay reseñas. ¡Sé el primero en compartir!"}
            {activeTab === "albums" && "Todavía no hay álbumes favoritos."}
            {activeTab === "songs" && "Todavía no hay canciones favoritas."}
          </p>
        </div>
      </div>
    </div>
  );
}
