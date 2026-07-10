"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGetMe, apiGetRecommendations } from "@/lib/api";
import { coverGradient } from "@/lib/review-format";
import type { RecommendationItem } from "@/types/api";

interface RecommendationsClientProps {
  accessToken: string;
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <Link
      href={`/album/${item.deezerId}`}
      className="flex flex-col bg-mb-card border border-mb-border rounded-xl overflow-hidden transition-colors hover:border-mb-ddp"
    >
      <span
        role="img"
        aria-label={`Cover de ${item.title}`}
        className="block aspect-square"
        style={
          item.coverUrl
            ? { backgroundImage: `url(${item.coverUrl})`, backgroundSize: "cover" }
            : { background: coverGradient(item.deezerId) }
        }
      />
      <span className="flex flex-col p-4">
        <span className="font-serif text-[17px] text-mb-text leading-tight line-clamp-2">
          {item.title}
        </span>
        <span className="text-[13px] text-mb-muted truncate mt-0.5">{item.artistName}</span>
        <span aria-hidden className="h-px w-full bg-mb-border my-3.5" />
        <span className="text-sm italic text-mb-accent">{item.reasonLabel}</span>
      </span>
    </Link>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col bg-mb-card border border-mb-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-mb-input" />
          <div className="p-4 space-y-2">
            <div className="h-3.5 w-4/5 rounded bg-mb-input" />
            <div className="h-3 w-1/2 rounded bg-mb-input" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRecommendations({ reviewCount }: { reviewCount: number }) {
  const count = Math.max(0, Math.min(3, reviewCount));
  const hint =
    count === 0 ? "Empezá ahora" : count === 1 ? "Faltan 2 más" : count === 2 ? "Solo falta 1 más" : "";

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 min-h-[60vh]">
      <div
        aria-hidden
        className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-7"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(61,26,122,0.5), rgba(30,10,60,0.15) 70%)",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8B56E8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.2 7.8 13.4 13.4 7.8 16.2 10.6 10.6" fill="#8B56E8" stroke="none" />
        </svg>
      </div>
      <h1 className="font-serif font-normal text-[28px] leading-tight text-mb-text mb-3">
        Aún no tenemos suficiente info
      </h1>
      <p className="text-[15px] leading-relaxed text-mb-muted max-w-[420px] mb-8">
        Escribí al menos 3 reseñas para que podamos entender tu gusto musical y sugerirte qué
        escuchar.
      </p>

      <div className="w-[340px] max-w-full mb-2.5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[13px] text-mb-muted font-medium">{count} / 3 reseñas</span>
          <span className="text-[13px] text-mb-accent">{hint}</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${count} de 3 reseñas`}
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={3}
          className="h-1.5 w-full bg-mb-input rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-mb-primary rounded-full transition-all"
            style={{ width: `${(count / 3) * 100}%` }}
          />
        </div>
      </div>

      <Link
        href="/search"
        className="mt-6 min-h-12 flex items-center px-6 rounded-lg bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] transition-all hover:shadow-[0_0_20px_rgba(107,53,212,0.35)]"
      >
        Buscar qué reseñar →
      </Link>
    </div>
  );
}

export function RecommendationsClient({ accessToken }: RecommendationsClientProps) {
  const recsQuery = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => apiGetRecommendations(accessToken),
    staleTime: 60 * 1000,
  });

  const insufficientReviews = recsQuery.data === null;

  const meQuery = useQuery({
    queryKey: ["me-review-count"],
    queryFn: () => apiGetMe(accessToken),
    enabled: insufficientReviews,
  });

  const isLoading = recsQuery.isLoading || (insufficientReviews && meQuery.isLoading);
  const recommendations = recsQuery.data?.data.recommendations ?? [];

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <div className="max-w-[1000px] mx-auto px-6 md:px-[clamp(20px,3vw,48px)] py-9 md:py-12">
        {isLoading ? (
          <RecommendationsSkeleton />
        ) : insufficientReviews ? (
          <EmptyRecommendations reviewCount={meQuery.data?.data.stats.reviewCount ?? 0} />
        ) : (
          <>
            <header className="mb-8">
              <h1 className="font-serif font-normal text-[32px] leading-tight text-mb-text mb-2">
                Para vos
              </h1>
              <p className="text-sm text-mb-muted">Basado en tus reseñas recientes.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {recommendations.map((item) => (
                <RecommendationCard key={item.deezerId} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
