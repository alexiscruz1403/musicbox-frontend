import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { apiCatalogAlbum } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { AlbumClient } from "./album-client";

export async function generateMetadata({
  params,
}: PageProps<"/album/[deezerId]">): Promise<Metadata> {
  try {
    const { deezerId } = await params;
    const session = await auth();
    const { data } = await apiCatalogAlbum(deezerId, session?.accessToken);
    return {
      title: `${data.title} — ${data.artist.name} | MusicBox`,
    };
  } catch {
    return { title: "Álbum | MusicBox" };
  }
}

export default async function AlbumPage({
  params,
}: PageProps<"/album/[deezerId]">) {
  const { deezerId } = await params;
  const session = await auth();

  let album;
  try {
    const { data } = await apiCatalogAlbum(deezerId, session?.accessToken);
    album = data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return <AlbumClient album={album} hasSession={!!session} />;
}
