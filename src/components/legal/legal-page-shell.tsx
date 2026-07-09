import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-mb-bg py-10 px-4 md:py-14">
      <div className="max-w-[840px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-mb-muted hover:text-mb-text transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="bg-white rounded-sm shadow-[0_2px_14px_rgba(20,20,19,0.35)] px-6 py-9 md:px-[0.85in] md:py-[0.85in]">
          <h1 className="font-serif font-normal text-[32px] text-[#1a1a26] mb-1.5">{title}</h1>
          <p className="text-[13px] text-[#6b6580] mb-3.5">{lastUpdated}</p>
          <hr className="h-0.5 w-full bg-gradient-to-r from-[#6B35D4] to-transparent border-none mb-5" />
          {children}
        </div>
      </div>
    </div>
  );
}
