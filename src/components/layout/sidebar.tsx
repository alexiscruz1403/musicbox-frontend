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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/recommendations", icon: Sparkles, label: "Recomendaciones" },
];

interface SidebarProps {
  session: Session | null;
}

export function Sidebar({ session }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
        <span className="text-xl shrink-0" aria-hidden>
          🎵
        </span>
        {!collapsed && (
          <span className="font-serif text-lg text-mb-text font-semibold whitespace-nowrap">
            MusicBox
          </span>
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
            {!collapsed && <span className="truncate">Mi perfil</span>}
          </Link>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-3 mb-2 p-2 rounded-lg text-mb-dim hover:text-mb-muted hover:bg-mb-input transition-colors flex items-center justify-center"
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
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
