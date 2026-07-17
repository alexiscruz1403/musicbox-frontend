import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { apiCatalogArtist, apiCatalogArtistAlbums, apiCatalogArtistTracks } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ArtistClient } from "./artist-client";

export async function generateMetadata({
  params,
}: PageProps<"/artist/[deezerId]">): Promise<Metadata> {
  try {
    const { deezerId } = await params;
    const session = await auth();
    const { data } = await apiCatalogArtist(deezerId, session?.accessToken);
    return {
      title: `${data.name} | Vinlyst`,
    };
  } catch {
    return { title: "Artista | Vinlyst" };
  }
}

export default async function ArtistPage({
  params,
}: PageProps<"/artist/[deezerId]">) {
  const { deezerId } = await params;
  const session = await auth();

  let artist;
  let albumsTotal;
  let tracksTotal;
  try {
    const [artistRes, albumsRes, tracksRes] = await Promise.all([
      apiCatalogArtist(deezerId, session?.accessToken),
      apiCatalogArtistAlbums(deezerId, 1),
      apiCatalogArtistTracks(deezerId, 1),
    ]);
    artist = artistRes.data;
    albumsTotal = albumsRes.data.total;
    tracksTotal = tracksRes.data.total;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <ArtistClient
      artist={artist}
      albumsTotal={albumsTotal}
      tracksTotal={tracksTotal}
    />
  );
}
