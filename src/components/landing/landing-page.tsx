import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { coverGradient, getInitials, ratingColor } from "@/lib/review-format";
import type { CatalogReview, TrendingAlbum } from "@/types/api";

export interface LandingReviewItem {
  album: TrendingAlbum;
  review: CatalogReview;
}

interface LandingPageProps {
  albums: TrendingAlbum[];
  reviews: LandingReviewItem[];
}

const COLLAGE_SLOTS: { col: 0 | 1 | 2; height: string }[] = [
  { col: 0, height: "h-[230px]" },
  { col: 0, height: "h-[178px]" },
  { col: 1, height: "h-[190px]" },
  { col: 1, height: "h-[270px]" },
  { col: 2, height: "h-[250px]" },
  { col: 2, height: "h-[196px]" },
];

const COLUMN_OFFSET: Record<0 | 1 | 2, string> = {
  0: "sm:mt-8",
  1: "",
  2: "sm:mt-16",
};

const FEATURE_ICONS = [
  <svg key="tracks" width={26} height={26} viewBox="0 0 34 34" fill="none" stroke="#8B56E8" strokeWidth={1.8} strokeLinecap="round">
    <line x1={6} y1={22} x2={6} y2={12} />
    <line x1={13} y1={26} x2={13} y2={8} />
    <line x1={20} y1={24} x2={20} y2={14} />
    <line x1={27} y1={27} x2={27} y2={6} />
  </svg>,
  <svg key="community" width={26} height={26} viewBox="0 0 34 34" fill="none" stroke="#8B56E8" strokeWidth={1.8}>
    <circle cx={13} cy={13} r={5} />
    <circle cx={23} cy={16} r={4} />
    <path d="M5 28c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
    <path d="M21 26c.6-2.8 3-5 6-5 1.4 0 2.7.5 3.7 1.3" strokeLinecap="round" />
  </svg>,
  <svg key="trending" width={26} height={26} viewBox="0 0 34 34" fill="none" stroke="#8B56E8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5,24 13,16 19,21 29,9" />
    <polyline points="23,9 29,9 29,15" />
  </svg>,
];

export async function LandingPage({ albums, reviews }: LandingPageProps) {
  const t = await getTranslations("Landing");
  const tCommon = await getTranslations("Common");
  const tReviewsCard = await getTranslations("Reviews.card");

  const columns = [0, 1, 2].map((col) =>
    COLLAGE_SLOTS.map((slot, i) => ({ ...slot, album: albums[i] })).filter(
      (slot) => slot.col === col && slot.album,
    ),
  );
  const hasCollage = albums.length > 0;
  const hasReviews = reviews.length > 0;

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] py-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vinlyst.png" alt="" className="w-7 h-7" />
          <span className="font-serif text-xl text-mb-text">Vinlyst</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="h-11 inline-flex items-center px-4 rounded-xl text-mb-muted hover:text-mb-text hover:bg-mb-card font-medium text-sm transition-colors"
          >
            {t("nav.signIn")}
          </Link>
          <Link
            href="/register"
            className="h-11 inline-flex items-center px-5 rounded-xl bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-sm transition-colors"
          >
            {t("nav.signUp")}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pt-8 pb-20 flex flex-wrap items-center gap-12 lg:gap-16">
        <div className="flex-1 min-w-[300px] basis-[400px]">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mb-card text-mb-accent text-xs font-semibold mb-6">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-mb-primary-h" />
            {t("hero.badge")}
          </span>
          <h1 className="font-serif font-normal text-[clamp(40px,6vw,72px)] leading-[1.04] tracking-tight text-mb-text mb-6">
            {t("hero.titleLine1")}
            <br />
            {t("hero.titleLine2")}
          </h1>
          <p className="text-mb-muted text-base md:text-lg leading-relaxed max-w-[520px] mb-8">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/register"
              className="h-[52px] inline-flex items-center px-7 rounded-xl bg-mb-primary hover:bg-mb-primary-h text-white font-semibold text-[15px] transition-colors"
            >
              {t("hero.ctaPrimary")}
            </Link>
            <Link
              href="/trending"
              className="h-[52px] inline-flex items-center px-6 rounded-xl bg-mb-card text-mb-muted hover:text-mb-text font-medium text-[15px] transition-colors"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>

        {hasCollage && (
          <div className="flex-1 min-w-[300px] basis-[440px] flex gap-5">
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className={`flex-1 flex flex-col gap-5 ${COLUMN_OFFSET[colIndex as 0 | 1 | 2]}`}
              >
                {column.map((slot) => {
                  const album = slot.album!;
                  return (
                    <div
                      key={album.deezerId}
                      role="img"
                      aria-label={tCommon("coverAlt", { title: album.title })}
                      className={`relative ${slot.height} rounded-2xl overflow-hidden border border-mb-border bg-mb-card transition-transform hover:-translate-y-1`}
                    >
                      {album.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.coverUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: coverGradient(album.deezerId) }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      {album.avgRating != null && (
                        <span
                          className="absolute top-3 right-3 font-mono font-bold text-sm px-2 py-1 rounded bg-mb-bg/80 border border-mb-ddp"
                          style={{ color: ratingColor(album.avgRating) }}
                        >
                          {album.avgRating.toFixed(1)}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="font-serif text-[17px] text-mb-text leading-tight truncate">
                          {album.title}
                        </div>
                        <div className="text-xs text-mb-muted mt-0.5 truncate">
                          {album.artist.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {(["item1", "item2", "item3"] as const).map((item, i) => (
          <div key={item} className="bg-mb-card border border-mb-border rounded-xl p-7">
            <div
              aria-hidden
              className="w-14 h-14 rounded-2xl bg-mb-input flex items-center justify-center mb-5"
            >
              {FEATURE_ICONS[i]}
            </div>
            <h3 className="font-semibold text-lg text-mb-text mb-2.5">
              {t(`features.${item}.title`)}
            </h3>
            <p className="text-[15px] leading-relaxed text-mb-muted">
              {t(`features.${item}.body`)}
            </p>
          </div>
        ))}
      </section>

      {/* Mini feed */}
      {hasReviews && (
        <section className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] pb-24">
          <h2 className="text-center font-serif font-normal text-[clamp(26px,3vw,32px)] text-mb-text mb-4">
            {t("miniFeed.heading")}
          </h2>
          <div
            aria-hidden
            className="h-px w-[200px] mx-auto mb-12 bg-gradient-to-r from-transparent via-mb-primary to-transparent"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(({ album, review }, i) => (
              <article
                key={`${review.id}-${i}`}
                className="bg-mb-card border border-mb-border rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex gap-3.5 items-start">
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverUrl}
                      alt={tCommon("coverAlt", { title: album.title })}
                      className="w-[60px] h-[60px] rounded-2xl shrink-0 object-cover"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={tCommon("coverAlt", { title: album.title })}
                      className="w-[60px] h-[60px] rounded-2xl shrink-0"
                      style={{ background: coverGradient(album.deezerId) }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-lg text-mb-text leading-tight truncate">
                      {album.title}
                    </div>
                    <div className="text-xs text-mb-muted mt-0.5 truncate">
                      {album.artist.name}
                    </div>
                  </div>
                  <div
                    className="font-mono font-bold text-[28px] leading-none"
                    style={{ color: ratingColor(review.rating) }}
                  >
                    {review.rating.toFixed(1)}
                  </div>
                </div>
                <p className="text-[15px] leading-relaxed text-mb-text line-clamp-2">
                  {review.description}
                </p>
                <div className="flex items-center gap-2.5 pt-3.5 border-t border-mb-border">
                  {review.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.user.avatarUrl}
                      alt={tReviewsCard("avatarAlt", { name: review.user.displayName })}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-mb-dp flex items-center justify-center text-[11px] font-semibold text-mb-accent shrink-0">
                      {getInitials(review.user.displayName)}
                    </span>
                  )}
                  <span className="text-[13px] text-mb-text">{review.user.displayName}</span>
                  <span className="font-mono text-xs text-mb-muted">@{review.user.handle}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-11">
            <Link
              href="/trending"
              className="h-[50px] inline-flex items-center px-6 rounded-xl bg-mb-card border border-mb-border text-mb-accent font-semibold text-[15px] transition-transform hover:-translate-y-0.5"
            >
              {t("miniFeed.cta")}
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-mb-border">
        <div className="max-w-[1200px] mx-auto px-6 md:px-[clamp(24px,5vw,48px)] py-8 flex flex-wrap items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vinlyst.png" alt="" className="w-5 h-5" />
            <span className="font-serif text-base text-mb-text">Vinlyst</span>
          </span>
          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-mb-muted hover:text-mb-text transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="text-xs text-mb-muted hover:text-mb-text transition-colors">
              {t("footer.terms")}
            </Link>
          </nav>
          <span className="text-xs text-mb-dim">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </footer>
    </div>
  );
}
