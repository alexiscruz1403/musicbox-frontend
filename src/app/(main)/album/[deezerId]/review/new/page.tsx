import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { apiCatalogAlbum, apiGetReview, ApiError } from "@/lib/api";
import type { ReviewDetail } from "@/types/api";
import { AlbumReviewFormClient } from "./album-review-form-client";

export default async function NewAlbumReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ deezerId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { deezerId } = await params;
  const { edit } = await searchParams;
  const session = await auth();

  if (!session) {
    const target = `/album/${deezerId}/review/new${edit ? `?edit=${edit}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }

  let album;
  try {
    const { data } = await apiCatalogAlbum(deezerId);
    album = data;
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
    <AlbumReviewFormClient
      album={album}
      accessToken={session.accessToken}
      existingReview={existingReview}
    />
  );
}
