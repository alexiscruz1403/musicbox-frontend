import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Bell, FileText, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LogoutButton } from "./logout-button";
import { BackButton } from "./back-button";
import { LanguageToggle } from "./language-toggle";

const ITEMS = [
  { key: "account", icon: User, href: "/settings/account" },
  { key: "notifications", icon: Bell, href: "/settings/notifications" },
  { key: "terms", icon: FileText, href: "/terms" },
] as const;

export default async function SettingsHubPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const t = await getTranslations("Settings.hub");

  return (
    <div className="min-h-screen bg-mb-bg">
      <div className="max-w-xl mx-auto px-4 md:px-0 py-8 md:py-12">
        <BackButton />
        <h1 className="font-serif text-3xl text-mb-text mb-8">{t("title")}</h1>

        <div className="mb-3">
          <LanguageToggle />
        </div>

        <div className="flex flex-col gap-3">
          {ITEMS.map(({ key, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 min-h-16 px-4.5 py-4 bg-mb-card border border-mb-border rounded-xl hover:border-mb-ddp hover:bg-mb-input/50 transition-colors"
            >
              <span className="shrink-0 w-[42px] h-[42px] rounded-[10px] bg-mb-dp flex items-center justify-center text-mb-accent">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-mb-text">{t(`${key}.title`)}</span>
                <span className="block text-[13px] text-mb-muted mt-0.5">{t(`${key}.subtitle`)}</span>
              </span>
              <ChevronRight className="shrink-0 w-[18px] h-[18px] text-mb-dim" />
            </Link>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-mb-border">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
