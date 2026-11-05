import { bradleyTerry, type Outcome } from "./bradley-terry";

export type PairTally = { winner: string; loser: string; wins: number };

export type Standing = {
  name: string;
  rating: number;
  /** Half the width of the 95% confidence interval. */
  uncertainty: number;
  lowerBound: number;
  wins: number;
  games: number;
  /** Share of games won, 0 to 1. Null with no games. */
  winRate: number | null;
};

/**
 * One Bradley–Terry fit over every registered model, so pausing a model doesn't
 * move the others. Sorted by the lower confidence bound. A model with no votes
 * has a zero-width interval at the center, so it goes last instead of above
 * models with real results.
 */
export function computeStandings(modelNames: readonly string[], tallies: readonly PairTally[]): Standing[] {
  const known = new Set(modelNames);
  const outcomes: Outcome[] = tallies
    .filter((tally) => known.has(tally.winner) && known.has(tally.loser))
    .flatMap((tally) => Array.from({ length: tally.wins }, () => ({ winner: tally.winner, loser: tally.loser })));

  const ratings = bradleyTerry([...modelNames], outcomes);
  const rated = ratings.filter((rating) => rating.games > 0);
  const unrated = ratings.filter((rating) => rating.games === 0).sort((a, b) => a.id.localeCompare(b.id));

  return [...rated, ...unrated].map((rating) => ({
    name: rating.id,
    rating: Math.round(rating.rating),
    uncertainty: Math.round((rating.ciHigh - rating.ciLow) / 2),
    lowerBound: rating.ciLow,
    wins: rating.wins,
    games: rating.games,
    winRate: rating.games > 0 ? rating.wins / rating.games : null,
  }));
}

export type HeadToHead = { wins: number; games: number };

/** Result of the first model against the second, for the grid on the admin Results page. */
export function headToHead(tallies: readonly PairTally[], first: string, second: string): HeadToHead {
  let wins = 0;
  let games = 0;
  for (const tally of tallies) {
    if (tally.winner === first && tally.loser === second) {
      wins += tally.wins;
      games += tally.wins;
    } else if (tally.winner === second && tally.loser === first) {
      games += tally.wins;
    }
  }
  return { wins, games };
}
