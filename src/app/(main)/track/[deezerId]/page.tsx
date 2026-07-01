import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiCatalogTrack } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { TrackClient } from "./track-client";

export async function generateMetadata({
  params,
}: PageProps<"/track/[deezerId]">): Promise<Metadata> {
  try {
    const { deezerId } = await params;
    const { data } = await apiCatalogTrack(deezerId);
    return {
      title: `${data.title} — ${data.artist.name} | MusicBox`,
    };
  } catch {
    return { title: "Canción | MusicBox" };
  }
}

export default async function TrackPage({
  params,
}: PageProps<"/track/[deezerId]">) {
  const { deezerId } = await params;

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

  return <TrackClient track={track} />;
}
