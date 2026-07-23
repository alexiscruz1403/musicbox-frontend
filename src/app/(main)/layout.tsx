import { getValidSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { OfflineModeGate } from "@/components/offline/offline-mode-gate";
import { PushSubscribe } from "@/components/pwa/push-subscribe";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidSession();
  const accessToken = session?.accessToken ?? null;

  return (
    <div className="flex min-h-screen bg-mb-bg">
      <Sidebar session={session} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <OfflineModeGate accessToken={accessToken}>{children}</OfflineModeGate>
      </main>
      <MobileTabBar session={session} />
      <NotificationsProvider accessToken={accessToken} />
      <PushSubscribe accessToken={accessToken} />
    </div>
  );
}
