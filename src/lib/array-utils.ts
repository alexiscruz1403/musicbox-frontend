export function dedupeById<T extends { deezerId: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.deezerId)) continue;
    seen.add(item.deezerId);
    result.push(item);
  }
  return result;
}
