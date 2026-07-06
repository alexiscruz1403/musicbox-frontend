import { Suspense } from "react";
import { TrendingClient } from "./trending-client";

export const metadata = {
  title: "Trending — MusicBox",
};

export default function TrendingPage() {
  return (
    <Suspense>
      <TrendingClient />
    </Suspense>
  );
}
