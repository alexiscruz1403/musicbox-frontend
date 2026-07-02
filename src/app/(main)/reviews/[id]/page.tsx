import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { apiGetReview, ApiError } from "@/lib/api";
import { ReviewDetailClient } from "./review-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { data } = await apiGetReview(id);
    const title = data.externalTitle ?? "reseña";
    const byline = data.user.handle ? ` por @${data.user.handle}` : "";
    return {
      title: `Reseña de ${title}${byline} | MusicBox`,
    };
  } catch {
    return { title: "Reseña | MusicBox" };
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
