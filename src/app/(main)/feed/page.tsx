import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { FeedClient } from "./feed-client";

export const metadata: Metadata = {
  title: "Tu feed | Vinlyst",
};

export default async function FeedPage() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/feed")}`);
  }

  return <FeedClient accessToken={session.accessToken} />;
}
