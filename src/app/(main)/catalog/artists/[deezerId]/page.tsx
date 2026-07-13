import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiCatalogArtist, apiCatalogArtistAlbums, apiCatalogArtistTracks } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ArtistClient } from "./artist-client";

export async function generateMetadata({
  params,
}: PageProps<"/catalog/artists/[deezerId]">): Promise<Metadata> {
  try {
    const { deezerId } = await params;
    const { data } = await apiCatalogArtist(deezerId);
    return {
      title: `${data.name} | MusicBox`,
    };
  } catch {
    return { title: "Artista | MusicBox" };
  }
}

export default async function ArtistPage({
  params,
}: PageProps<"/catalog/artists/[deezerId]">) {
  const { deezerId } = await params;

  let artist;
  let albumsTotal;
  let tracksTotal;
  try {
    const [artistRes, albumsRes, tracksRes] = await Promise.all([
      apiCatalogArtist(deezerId),
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
