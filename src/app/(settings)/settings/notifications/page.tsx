import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { apiGetNotificationPrefs } from "@/lib/api";
import NotificationsClient from "./notifications-client";

export default async function SettingsNotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { data } = await apiGetNotificationPrefs(session.accessToken);

  return <NotificationsClient initialPrefs={data} accessToken={session.accessToken} />;
}
