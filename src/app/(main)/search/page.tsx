import { Suspense } from "react";
import { auth } from "@/auth";
import { SearchClient } from "./search-client";

export const metadata = {
  title: "Buscar — MusicBox",
};

export default async function SearchPage() {
  const session = await auth();

  return (
    <Suspense>
      <SearchClient accessToken={session?.accessToken} />
    </Suspense>
  );
}
