export const SORT_KEYS = ["rank", "rating", "winRate", "wer", "cer"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SortableRow = {
  rating: number;
  games: number;
  winRate: number | null;
  metrics: { wer: number; cer: number } | null;
};

/** The default order, from the server, is the rank. An unknown value in the URL also gets it. */
export function parseSortKey(value: unknown): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "rank";
}

/** A lower value is better for the rank, WER and CER. A higher value is better for the others. */
export function lowerIsBetter(key: SortKey): boolean {
  return key === "rank" || key === "wer" || key === "cer";
}

function sortValue(row: SortableRow, key: Exclude<SortKey, "rank">): number | null {
  switch (key) {
    case "rating":
      // A model with no votes shows no rating.
      return row.games > 0 ? row.rating : null;
    case "winRate":
      return row.winRate;
    case "wer":
      return row.metrics?.wer ?? null;
    case "cer":
      return row.metrics?.cer ?? null;
  }
}

/**
 * Returns the rows with the best value first and rows with no value last.
 * Equal values keep the given order, so give the rows in rank order.
 */
export function sortRows<Row extends SortableRow>(rows: readonly Row[], key: SortKey): Row[] {
  if (key === "rank") return [...rows];
  const direction = lowerIsBetter(key) ? 1 : -1;
  return [...rows].sort((first, second) => {
    const a = sortValue(first, key);
    const b = sortValue(second, key);
    if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
    return (a - b) * direction;
  });
}
