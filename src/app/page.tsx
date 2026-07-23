import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getValidSession } from "@/lib/session";
import { apiAlbumReviews, apiTrendingAlbums } from "@/lib/api";
import { LandingPage, type LandingReviewItem } from "@/components/landing/landing-page";
import type { CatalogReview, TrendingAlbum } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Landing");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Picks up to 3 reviews to showcase on the landing: one per distinct album
// first. Only once every trending album has been tried does it fall back to
// pulling a second review from an album already used, and only as a last
// resort repeats a review outright — real distinct albums are preferred.
async function getLandingReviews(albums: TrendingAlbum[]): Promise<LandingReviewItem[]> {
  const results = await Promise.allSettled(
    albums.map((album) => apiAlbumReviews(album.deezerId)),
  );

  const perAlbum: { album: TrendingAlbum; reviews: CatalogReview[] }[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value.data.items.length > 0) {
      perAlbum.push({ album: albums[i], reviews: result.value.data.items });
    }
  });

  const picks: LandingReviewItem[] = [];

  for (const entry of perAlbum) {
    if (picks.length >= 3) break;
    picks.push({ album: entry.album, review: entry.reviews[0] });
  }

  let round = 1;
  while (picks.length < 3 && perAlbum.some((entry) => entry.reviews.length > round)) {
    for (const entry of perAlbum) {
      if (picks.length >= 3) break;
      if (entry.reviews[round]) {
        picks.push({ album: entry.album, review: entry.reviews[round] });
      }
    }
    round++;
  }

  // Extreme fallback (catalog has fewer than 3 reviews in total across the
  // trending albums): repeat what's already available rather than showing
  // an empty or half-filled section.
  const baseCount = picks.length;
  while (baseCount > 0 && picks.length < 3) {
    picks.push(picks[picks.length % baseCount]);
  }

  return picks;
}

export default async function RootPage() {
  const session = await getValidSession();

  if (session) {
    redirect("/feed");
  }

  const albums = await apiTrendingAlbums(6)
    .then((res) => res.data)
    .catch(() => []);

  const reviews = await getLandingReviews(albums).catch(() => []);

  return <LandingPage albums={albums} reviews={reviews} />;
}
