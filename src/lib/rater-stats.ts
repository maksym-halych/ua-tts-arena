export type RaterVote = {
  raterId: string;
  itemId: string;
  winner: string;
  loser: string;
  chosenSide: "a" | "b";
  decisionMs: number;
  /** False if the vote or its rater is excluded. */
  counted: boolean;
};

export type RaterStats = {
  raterId: string;
  votes: number;
  medianDecisionMs: number | null;
  /** Share of votes for side A, 0 to 1. */
  sideAShare: number | null;
  /** Share of votes that agree with the majority of the other raters, 0 to 1. */
  agreement: number | null;
  /** Votes where the other raters had a clear majority. */
  agreementVotes: number;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function pairKey(vote: RaterVote): string {
  return vote.winner < vote.loser ? `${vote.itemId}|${vote.winner}|${vote.loser}` : `${vote.itemId}|${vote.loser}|${vote.winner}`;
}

/**
 * Agreement compares each vote with the other raters' counted votes on the same
 * item and pair, so a rater's own votes never form the majority they are measured
 * against. A tie or no other votes gives no result for that vote. Excluded raters
 * still get a value, which helps an admin decide whether to restore them.
 */
export function computeRaterStats(votes: readonly RaterVote[]): Map<string, RaterStats> {
  const countedByCombination = new Map<string, RaterVote[]>();
  for (const vote of votes) {
    if (!vote.counted) continue;
    const key = pairKey(vote);
    const list = countedByCombination.get(key);
    if (list) list.push(vote);
    else countedByCombination.set(key, [vote]);
  }

  const byRater = new Map<string, RaterVote[]>();
  for (const vote of votes) {
    const list = byRater.get(vote.raterId);
    if (list) list.push(vote);
    else byRater.set(vote.raterId, [vote]);
  }

  const stats = new Map<string, RaterStats>();
  for (const [raterId, own] of byRater) {
    let compared = 0;
    let agreed = 0;
    for (const vote of own) {
      const others = (countedByCombination.get(pairKey(vote)) ?? []).filter((other) => other.raterId !== raterId);
      const forWinner = others.filter((other) => other.winner === vote.winner).length;
      const againstWinner = others.length - forWinner;
      if (forWinner === againstWinner) continue;
      compared += 1;
      if (forWinner > againstWinner) agreed += 1;
    }
    stats.set(raterId, {
      raterId,
      votes: own.length,
      medianDecisionMs: median(own.map((vote) => vote.decisionMs)),
      sideAShare: own.filter((vote) => vote.chosenSide === "a").length / own.length,
      agreement: compared > 0 ? agreed / compared : null,
      agreementVotes: compared,
    });
  }
  return stats;
}
