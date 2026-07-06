import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-mb-bg">
      <Sidebar session={session} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      <MobileTabBar session={session} />
      <NotificationsProvider accessToken={session?.accessToken ?? null} />
    </div>
  );
}
