"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, TrendingUp, Bell, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/stores/notifications-panel-store";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { PendingSyncBadge } from "@/components/offline/pending-sync-badge";
import { usePendingMutationCount } from "@/hooks/use-pending-mutation-count";
import type { Session } from "next-auth";

interface MobileTabBarProps {
  session: Session | null;
}

export function MobileTabBar({ session }: MobileTabBarProps) {
  const pathname = usePathname();
  const toggleNotifications = useNotificationsPanelStore((s) => s.toggle);
  const { data: unreadData } = useUnreadNotifications(session?.accessToken ?? null);
  const hasUnread = (unreadData?.data.items.length ?? 0) > 0;
  const pendingSyncCount = usePendingMutationCount();

  const tabs = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/recommendations", icon: Sparkles, label: "Recomendaciones" },
    {
      href: session ? `/u/${session.user.handle}` : "/login",
      icon: User,
      label: session ? "Perfil" : "Entrar",
    },
    ...(session?.user.role === "ADMIN"
      ? [{ href: "/admin/reports", icon: Shield, label: "Reportes" }]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-mb-card border-t border-mb-border z-50 safe-b">
      {session && pendingSyncCount > 0 && (
        <div className="flex justify-center py-1 border-b border-mb-border">
          <PendingSyncBadge />
        </div>
      )}
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href.startsWith("/u/") && pathname.startsWith("/u/")) ||
            (href === "/admin/reports" && pathname.startsWith("/admin"));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex items-center justify-center flex-1 h-full transition-colors",
                active ? "text-mb-accent" : "text-mb-muted",
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
        {session && (
          <button
            type="button"
            onClick={toggleNotifications}
            aria-label="Notificaciones"
            className="flex items-center justify-center flex-1 h-full text-mb-muted transition-colors cursor-pointer"
          >
            <span className="relative inline-flex">
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mb-primary"
                />
              )}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
