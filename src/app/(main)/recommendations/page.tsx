import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { RecommendationsClient } from "./recommendations-client";

export const metadata: Metadata = {
  title: "Recomendaciones | Vinlyst",
};

export default async function RecommendationsPage() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/recommendations")}`);
  }

  return <RecommendationsClient accessToken={session.accessToken} />;
}
