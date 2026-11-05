import "server-only";
import { averageMetrics, type MetricAverages } from "@/lib/model-folder";
import { computeStandings, type PairTally, type Standing } from "@/lib/standings";
import { loadMetrics } from "./catalog";
import { forget, memo } from "./memo";
import { db, fetchAll, must } from "./supabase";

export type ResultRow = Standing & { paused: boolean; metrics: MetricAverages | null };
export type Results = { rows: ResultRow[]; tallies: PairTally[] };

const CACHE_KEY = "results";
const CACHE_MS = 30 * 1000;

/** Every registered model, ranked. Callers leave out paused models where they must not appear. */
export function loadResults(): Promise<Results> {
  return memo(CACHE_KEY, CACHE_MS, async () => {
    const models = must(await db().from("models").select("name, paused_at"));
    const tallies = await fetchAll((from, to) =>
      db().from("pair_tallies").select("winner, loser, wins").order("winner").order("loser").range(from, to),
    );
    const clean = tallies.flatMap((tally) =>
      tally.winner && tally.loser && tally.wins !== null ? [{ winner: tally.winner, loser: tally.loser, wins: tally.wins }] : [],
    );

    const paused = new Set(models.filter((model) => model.paused_at).map((model) => model.name));
    const standings = computeStandings(
      models.map((model) => model.name),
      clean,
    );
    const metrics = await Promise.all(
      standings.map(async (row) => {
        // A folder that can't be read must not take the leaderboard down.
        const file = await loadMetrics(row.name).catch(() => null);
        return file ? averageMetrics(file) : null;
      }),
    );
    return {
      rows: standings.map((row, index) => ({ ...row, paused: paused.has(row.name), metrics: metrics[index] ?? null })),
      tallies: clean,
    };
  });
}

/** Call after a change that moves the ranking. */
export function forgetResults(): void {
  forget(CACHE_KEY);
}
