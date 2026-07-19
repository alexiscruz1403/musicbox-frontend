"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Search,
  Sparkles,
  User,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PendingSyncBadge } from "@/components/offline/pending-sync-badge";
import { usePendingMutationCount } from "@/hooks/use-pending-mutation-count";
import type { Session } from "next-auth";

interface SidebarProps {
  session: Session | null;
}

export function Sidebar({ session }: SidebarProps) {
  const t = useTranslations("Nav");
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const pendingSyncCount = usePendingMutationCount();

  const NAV_ITEMS = [
    { href: "/feed", icon: Home, label: t("feed") },
    { href: "/trending", icon: TrendingUp, label: t("trending") },
    { href: "/search", icon: Search, label: t("search") },
    { href: "/recommendations", icon: Sparkles, label: t("recommendations") },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-mb-card border-r border-mb-border h-screen sticky top-0 shrink-0 transition-all duration-200",
        collapsed ? "w-[76px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-mb-border overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vinlyst.png" alt="" aria-hidden className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <span className="font-serif text-lg text-mb-text font-semibold whitespace-nowrap">
            Vinlyst
          </span>
        )}
        {session && (
          <NotificationBell accessToken={session.accessToken} className="ml-auto w-8 h-8 shrink-0" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-mb-dp text-mb-accent"
                  : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-mb-primary rounded-r-full" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {session && (
          <Link
            href={`/u/${session.user.handle}`}
            className={cn(
              "relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/u/")
                ? "bg-mb-dp text-mb-accent"
                : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
            )}
          >
            {pathname.startsWith("/u/") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-mb-primary rounded-r-full" />
            )}
            <User className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{t("profile")}</span>}
          </Link>
        )}

        {session && (
          <Link
            href="/settings"
            className={cn(
              "relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-mb-dp text-mb-accent"
                : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
            )}
          >
            {pathname.startsWith("/settings") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-mb-primary rounded-r-full" />
            )}
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{t("settings")}</span>}
          </Link>
        )}

        {session?.user.role === "ADMIN" && (
          <Link
            href="/admin/reports"
            className={cn(
              "relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-mb-dp text-mb-accent"
                : "text-mb-muted hover:bg-mb-input hover:text-mb-text",
            )}
          >
            {pathname.startsWith("/admin") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-mb-primary rounded-r-full" />
            )}
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{t("reports")}</span>}
          </Link>
        )}
      </nav>

      {session && !collapsed && pendingSyncCount > 0 && (
        <div className="mx-3 mb-2">
          <PendingSyncBadge />
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-3 mb-2 p-2 rounded-lg text-mb-dim hover:text-mb-muted hover:bg-mb-input transition-colors flex items-center justify-center cursor-pointer"
        aria-label={collapsed ? t("expandMenu") : t("collapseMenu")}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* User */}
      {session && (
        <div
          className={cn(
            "border-t border-mb-border p-3 flex items-center gap-3 overflow-hidden",
            collapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-mb-ddp flex items-center justify-center text-xs font-bold text-mb-accent shrink-0">
            {session.user.displayName[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-mb-text truncate">
                {session.user.displayName}
              </p>
              <p className="text-xs text-mb-dim font-mono truncate">
                @{session.user.handle}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
