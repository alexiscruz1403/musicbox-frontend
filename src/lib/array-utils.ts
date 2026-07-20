// Genérico por clave — antes existían dos implementaciones casi idénticas:
// dedupeById (clave deezerId, para resultados de catálogo paginados) y una
// dedupeByUserId local en follow-list-drawer.tsx (clave id, para listas de
// seguidores/seguidos). Ambas colapsan acá; dedupeById queda como alias para
// no tocar sus call sites existentes. Ver docs/musicbox-frontend-guide.md §12.
export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function dedupeById<T extends { deezerId: string }>(items: T[]): T[] {
  return dedupeByKey(items, (item) => item.deezerId);
}
