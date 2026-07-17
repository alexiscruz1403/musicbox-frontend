import { Suspense } from "react";
import { TrendingClient } from "./trending-client";

export const metadata = {
  title: "Trending — Vinlyst",
};

export default function TrendingPage() {
  return (
    <Suspense>
      <TrendingClient />
    </Suspense>
  );
}
