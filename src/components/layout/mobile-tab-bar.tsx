"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

interface MobileTabBarProps {
  session: Session | null;
}

export function MobileTabBar({ session }: MobileTabBarProps) {
  const pathname = usePathname();

  const tabs = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    {
      href: session ? `/u/${session.user.handle}` : "/login",
      icon: User,
      label: session ? "Perfil" : "Entrar",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-mb-card border-t border-mb-border z-50 safe-b">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href.startsWith("/u/") && pathname.startsWith("/u/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs transition-colors",
                active ? "text-mb-accent" : "text-mb-muted",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
