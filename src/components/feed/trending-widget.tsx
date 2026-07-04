// Static shell only — the backend GET /v1/trending/albums endpoint is Fase 5
// and not confirmed ready yet, so this deliberately doesn't fetch anything.
export function TrendingWidget() {
  return (
    <section className="bg-mb-card border border-mb-border rounded-xl p-5">
      <h2 className="text-[13px] font-semibold tracking-wide uppercase text-mb-muted mb-4">
        Trending ahora
      </h2>
      <p className="text-sm text-mb-dim">Disponible próximamente.</p>
    </section>
  );
}
