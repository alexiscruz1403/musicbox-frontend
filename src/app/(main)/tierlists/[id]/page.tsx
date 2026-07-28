import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { apiTierlist, ApiError } from "@/lib/api";
import { TierlistDetailClient } from "./tierlist-detail-client";

interface TierlistDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TierlistDetailPageProps): Promise<Metadata> {
  const t = await getTranslations("Tierlist.detail");
  try {
    const { id } = await params;
    const { data } = await apiTierlist(id);
    return { title: t("pageTitle", { name: data.externalArtistName }) };
  } catch {
    return { title: t("pageTitleFallback") };
  }
}

export default async function TierlistDetailPage({ params }: TierlistDetailPageProps) {
  const { id } = await params;
  const session = await getValidSession();

  let tierlist;
  try {
    const { data } = await apiTierlist(id, session?.accessToken);
    tierlist = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <TierlistDetailClient
      tierlist={tierlist}
      currentUserId={session?.user.id}
      currentUserHandle={session?.user.handle}
      currentUserDisplayName={session?.user.displayName}
      accessToken={session?.accessToken}
    />
  );
}
