import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { RecommendationsClient } from "./recommendations-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Recommendations");
  return { title: t("pageTitle") };
}

export default async function RecommendationsPage() {
  const session = await getValidSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/recommendations")}`);
  }

  return <RecommendationsClient accessToken={session.accessToken} />;
}
