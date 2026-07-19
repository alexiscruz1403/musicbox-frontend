import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrendingClient } from "./trending-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Trending");
  return { title: t("pageTitle") };
}

export default function TrendingPage() {
  return (
    <Suspense>
      <TrendingClient />
    </Suspense>
  );
}
