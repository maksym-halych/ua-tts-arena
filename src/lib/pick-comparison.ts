export type ModelItems = { name: string; itemIds: readonly string[] };
export type VotedCombination = { itemId: string; winner: string; loser: string };
export type Comparison = { itemId: string; modelA: string; modelB: string };

function combinationKey(itemId: string, first: string, second: string): string {
  return first < second ? `${itemId}|${first}|${second}` : `${itemId}|${second}|${first}`;
}

/**
 * Picks a random comparison that the rater has not voted on, or null if none is left.
 * Only items that both models have and that the dataset knows are candidates.
 * The side of each model is also random.
 */
export function pickComparison(
  models: readonly ModelItems[],
  voted: readonly VotedCombination[],
  knownItems: ReadonlySet<string>,
  random: () => number = Math.random,
): Comparison | null {
  const done = new Set(voted.map((vote) => combinationKey(vote.itemId, vote.winner, vote.loser)));
  const candidates: Comparison[] = [];

  models.forEach((first, index) => {
    const firstItems = new Set(first.itemIds);
    for (const second of models.slice(index + 1)) {
      for (const itemId of second.itemIds) {
        if (firstItems.has(itemId) && knownItems.has(itemId) && !done.has(combinationKey(itemId, first.name, second.name))) {
          candidates.push({ itemId, modelA: first.name, modelB: second.name });
        }
      }
    }
  });

  const picked = candidates[Math.floor(random() * candidates.length)];
  if (!picked) return null;
  return random() < 0.5 ? picked : { itemId: picked.itemId, modelA: picked.modelB, modelB: picked.modelA };
}

/**
 * Like pickComparison, but after a skip. It picks a different item if one is left.
 * If only the skipped item is left, it picks that item again, because the rater has not finished.
 */
export function pickAfterSkip(
  skippedItem: string,
  models: readonly ModelItems[],
  voted: readonly VotedCombination[],
  knownItems: ReadonlySet<string>,
  random: () => number = Math.random,
): Comparison | null {
  const others = new Set(knownItems);
  others.delete(skippedItem);
  return pickComparison(models, voted, others, random) ?? pickComparison(models, voted, knownItems, random);
}
