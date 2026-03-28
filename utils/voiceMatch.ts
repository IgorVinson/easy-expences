export function normalizeMatchName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function findBestNameMatch<T extends { name: string }>(
  items: T[],
  rawName: string
): T | null {
  if (!rawName.trim()) return null;
  const normalizedTarget = normalizeMatchName(rawName);
  const exact = items.find((item) => normalizeMatchName(item.name) === normalizedTarget);
  if (exact) return exact;
  const partial = items.find((item) => {
    const n = normalizeMatchName(item.name);
    return n.includes(normalizedTarget) || normalizedTarget.includes(n);
  });
  return partial ?? null;
}
