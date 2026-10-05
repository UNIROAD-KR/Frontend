export type MarketSortOrder = "newest" | "oldest";

type DatedListing = { createdAt?: string; updatedAt?: string };

function timestamp(item: DatedListing) {
  for (const value of [item.createdAt, item.updatedAt]) {
    if (!value) continue;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Sort fetched listings by publication date; keep undated entries last. */
export function compareMarketDates(a: DatedListing, b: DatedListing, order: MarketSortOrder) {
  const first = timestamp(a);
  const second = timestamp(b);
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  return order === "newest" ? second - first : first - second;
}
