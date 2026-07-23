import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { SearchClient } from "./search-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Search");
  return { title: t("pageTitle") };
}

export default async function SearchPage() {
  const session = await getValidSession();

  return (
    <Suspense>
      <SearchClient accessToken={session?.accessToken} />
    </Suspense>
  );
}
