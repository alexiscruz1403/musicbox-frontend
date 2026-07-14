import Link from "next/link";

type ErrorStateAction =
  | { type: "link"; href: string; label: string }
  | { type: "button"; onClick: () => void; label: string };

interface ErrorStateProps {
  code: "404" | "500";
  title: string;
  description: string;
  action: ErrorStateAction;
}

export function ErrorState({ code, title, description, action }: ErrorStateProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-mb-border bg-mb-bg px-8 py-14 text-center">
      <span
        aria-hidden="true"
        className="block font-serif text-[72px] leading-[0.9] text-mb-dp md:text-[120px]"
      >
        {code}
      </span>
      <h1 className="mt-2 font-serif text-2xl text-mb-text">{title}</h1>
      <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-mb-muted">
        {description}
      </p>
      {action.type === "link" ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-mb-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-mb-primary-h"
        >
          {action.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-mb-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-mb-primary-h"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
