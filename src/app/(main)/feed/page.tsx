import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { FeedClient } from "./feed-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Feed");
  return { title: t("pageTitle") };
}

export default async function FeedPage() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/feed")}`);
  }

  return <FeedClient accessToken={session.accessToken} />;
}
