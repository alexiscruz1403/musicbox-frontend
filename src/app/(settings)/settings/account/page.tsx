import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { apiGetMe } from "@/lib/api";
import AccountClient from "./account-client";

export default async function SettingsAccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { data } = await apiGetMe(session.accessToken);

  return (
    <AccountClient
      email={data.user.email}
      handle={session.user.handle}
      accessToken={session.accessToken}
      initialIsPrivate={data.user.isPrivate}
    />
  );
}
