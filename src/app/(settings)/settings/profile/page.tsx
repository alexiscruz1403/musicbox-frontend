import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { apiGetMe } from "@/lib/api";
import EditProfileClient from "./edit-profile-client";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { data } = await apiGetMe(session.accessToken);

  return (
    <EditProfileClient
      initialUser={data.user}
      accessToken={session.accessToken}
    />
  );
}
