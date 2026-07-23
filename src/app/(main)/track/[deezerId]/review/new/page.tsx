import { redirect, notFound } from "next/navigation";
import { getValidSession } from "@/lib/session";
import { apiCatalogTrack, apiGetReview, ApiError } from "@/lib/api";
import type { ReviewDetail } from "@/types/api";
import { TrackReviewFormClient } from "./track-review-form-client";

export default async function NewTrackReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ deezerId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { deezerId } = await params;
  const { edit } = await searchParams;
  const session = await getValidSession();

  if (!session) {
    const target = `/track/${deezerId}/review/new${edit ? `?edit=${edit}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }

  let track;
  try {
    const { data } = await apiCatalogTrack(deezerId);
    track = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  let existingReview: ReviewDetail | undefined;
  if (edit) {
    try {
      const { data } = await apiGetReview(edit, session.accessToken);
      if (data.userId === session.user.id) {
        existingReview = data;
      }
    } catch (err) {
      if (!(err instanceof ApiError && err.statusCode === 404)) {
        throw err;
      }
    }
  }

  return (
    <TrackReviewFormClient
      track={track}
      accessToken={session.accessToken}
      existingReview={existingReview}
    />
  );
}
