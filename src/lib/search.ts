export function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function includesQuery(query: string, ...parts: Array<string | number | null | undefined>) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return parts.some((part) => normalizeSearch(String(part ?? "")).includes(needle));
}
