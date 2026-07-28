import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { apiCatalogArtist, apiCatalogArtistAlbums, apiCatalogArtistTracks } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ArtistClient } from "./artist-client";

// El endpoint base devuelve el detalle extendido (payload pesado) y se llama
// dos veces por request (generateMetadata + el render). cache() deduplica esas
// dos llamadas dentro del mismo request; el accessToken forma parte de la clave
// y las dos ramas lo resuelven igual, así que sigue siendo un solo fetch.
// Sigue siendo público, pero con token resuelve además `artist.tierlistId`.
const getArtistDetail = cache((deezerId: string, accessToken?: string) =>
  apiCatalogArtist(deezerId, accessToken),
);

export async function generateMetadata({
  params,
}: PageProps<"/artist/[deezerId]">): Promise<Metadata> {
  const t = await getTranslations("Artist");
  try {
    const { deezerId } = await params;
    const session = await getValidSession();
    const { data } = await getArtistDetail(deezerId, session?.accessToken);
    return {
      title: t("pageTitle", { name: data.artist.name }),
    };
  } catch {
    return { title: t("pageTitleFallback") };
  }
}

export default async function ArtistPage({
  params,
}: PageProps<"/artist/[deezerId]">) {
  const { deezerId } = await params;
  const session = await getValidSession();

  let detail;
  let albumsTotal;
  let tracksTotal;
  try {
    const [artistRes, albumsRes, tracksRes] = await Promise.all([
      getArtistDetail(deezerId, session?.accessToken),
      apiCatalogArtistAlbums(deezerId, 1),
      apiCatalogArtistTracks(deezerId, 1),
    ]);
    detail = artistRes.data;
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
      detail={detail}
      albumsTotal={albumsTotal}
      tracksTotal={tracksTotal}
      hasSession={!!session}
    />
  );
}
