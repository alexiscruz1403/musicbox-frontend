export function TopGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-xl bg-mb-input" />
          <div className="mt-2.5 h-4 w-3/4 rounded bg-mb-input" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-mb-input" />
        </div>
      ))}
    </div>
  );
}
