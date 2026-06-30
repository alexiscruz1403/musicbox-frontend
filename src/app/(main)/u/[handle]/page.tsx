import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { apiGetProfile } from "@/lib/api";
import { ApiError } from "@/lib/api";
import ProfileClient from "./profile-client";

export default async function ProfilePage({
  params,
}: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const session = await auth();

  let profileData;
  try {
    const { data } = await apiGetProfile(handle, session?.accessToken);
    profileData = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <ProfileClient
      profile={profileData}
      isOwnProfile={session?.user.handle === handle}
      currentUserHandle={session?.user.handle}
      accessToken={session?.accessToken}
    />
  );
}
