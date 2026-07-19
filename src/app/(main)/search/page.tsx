import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SearchClient } from "./search-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Search");
  return { title: t("pageTitle") };
}

export default async function SearchPage() {
  const session = await auth();

  return (
    <Suspense>
      <SearchClient accessToken={session?.accessToken} />
    </Suspense>
  );
}
