import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import {
  apiCatalogArtist,
  apiCatalogArtistAlbumsAll,
  apiTierlist,
  ApiError,
} from "@/lib/api";
import type { Tierlist } from "@/types/api";
import { TierlistBuilderClient } from "./tierlist-builder-client";

// Tipado manual de params/searchParams (mismo precedente que reviews/[id]):
// `PageProps<'…'>` sale del codegen de Next y todavía no conoce esta ruta.
interface TierlistBuilderPageProps {
  params: Promise<{ deezerId: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: Pick<TierlistBuilderPageProps, "params">): Promise<Metadata> {
  const t = await getTranslations("Tierlist.builder");
  try {
    const { deezerId } = await params;
    const { data } = await apiCatalogArtist(deezerId);
    return { title: t("pageTitle", { name: data.artist.name }) };
  } catch {
    return { title: t("pageTitleFallback") };
  }
}

export default async function TierlistBuilderPage({
  params,
  searchParams,
}: TierlistBuilderPageProps) {
  const { deezerId } = await params;
  const { edit } = await searchParams;
  const session = await getValidSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/artist/${deezerId}/tierlist`)}`);
  }

  const editId = typeof edit === "string" ? edit : undefined;

  let artistName: string;
  let artistImageUrl: string | null;
  let albums;
  let existing: Tierlist | undefined;
  try {
    const [artistRes, albumsRes, tierlistRes] = await Promise.all([
      apiCatalogArtist(deezerId, session.accessToken),
      apiCatalogArtistAlbumsAll(deezerId),
      editId ? apiTierlist(editId, session.accessToken) : undefined,
    ]);
    artistName = artistRes.data.artist.name;
    artistImageUrl = artistRes.data.artist.imageUrl;
    albums = albumsRes.data.items;
    existing = tierlistRes?.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }

  // Un `?edit=` escrito a mano puede apuntar a una tierlist ajena (el PATCH
  // fallaría recién al guardar) o a la de otro artista (el tablero se armaría
  // con la discografía equivocada). Se resuelve antes de renderizar.
  if (existing && existing.userId !== session.user.id) {
    redirect(`/tierlists/${existing.id}`);
  }
  if (existing && existing.artist.deezerId !== deezerId) {
    redirect(`/artist/${existing.artist.deezerId}/tierlist?edit=${existing.id}`);
  }

  return (
    <TierlistBuilderClient
      artistDeezerId={deezerId}
      artistName={artistName}
      artistImageUrl={artistImageUrl}
      albums={albums}
      existing={existing}
      accessToken={session.accessToken}
    />
  );
}
