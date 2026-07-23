import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/session";
import AdminReportsClient from "./admin-reports-client";

export default async function AdminReportsPage() {
  const session = await getValidSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/feed");

  return <AdminReportsClient accessToken={session.accessToken} />;
}
