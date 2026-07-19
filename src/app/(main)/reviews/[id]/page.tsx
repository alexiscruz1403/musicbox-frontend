import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { apiGetReview, ApiError } from "@/lib/api";
import { ReviewDetailClient } from "./review-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("Reviews.detail");
  try {
    const { id } = await params;
    const { data } = await apiGetReview(id);
    const title = data.externalTitle ?? t("titleFallbackWord");
    const byline = data.user.handle ? t("bylineSuffix", { handle: data.user.handle }) : "";
    return {
      title: t("pageTitle", { title, byline }),
    };
  } catch {
    return { title: t("pageTitleFallback") };
  }
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  let review;
  try {
    const { data } = await apiGetReview(id, session?.accessToken);
    review = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <ReviewDetailClient
      review={review}
      currentUserId={session?.user.id}
      currentUserHandle={session?.user.handle}
      currentUserDisplayName={session?.user.displayName}
      accessToken={session?.accessToken}
    />
  );
}
