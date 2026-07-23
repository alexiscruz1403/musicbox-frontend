import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { apiCatalogTrack } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { TrackClient } from "./track-client";

export async function generateMetadata({
  params,
}: PageProps<"/track/[deezerId]">): Promise<Metadata> {
  const t = await getTranslations("Track");
  try {
    const { deezerId } = await params;
    const session = await getValidSession();
    const { data } = await apiCatalogTrack(deezerId, session?.accessToken);
    return {
      title: t("pageTitle", { trackTitle: data.title, artistName: data.artist.name }),
    };
  } catch {
    return { title: t("pageTitleFallback") };
  }
}

export default async function TrackPage({
  params,
}: PageProps<"/track/[deezerId]">) {
  const { deezerId } = await params;
  const session = await getValidSession();

  let track;
  try {
    const { data } = await apiCatalogTrack(deezerId, session?.accessToken);
    track = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return <TrackClient track={track} hasSession={!!session} />;
}
