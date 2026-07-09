import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminReportsClient from "./admin-reports-client";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/feed");

  return <AdminReportsClient accessToken={session.accessToken} />;
}
