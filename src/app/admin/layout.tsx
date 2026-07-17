import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mb-bg text-mb-text font-sans">
      <header className="sticky top-0 z-10 bg-mb-card border-b border-mb-border">
        <div className="max-w-[1100px] mx-auto px-4 md:px-10 h-14 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vinlyst.png" alt="" aria-hidden className="w-[18px] h-[18px]" />
          <span className="font-bold text-mb-text">Vinlyst</span>
          <span className="text-sm text-mb-dim">/ Admin</span>
          <div className="flex-1" />
          <Link
            href="/feed"
            className="text-sm text-mb-muted hover:text-mb-text transition-colors"
          >
            Volver a Vinlyst
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
