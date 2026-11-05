import "server-only";
import { requiredListenMs } from "@/lib/listening";
import { pickComparison } from "@/lib/pick-comparison";
import { loadDataset, loadMetrics } from "./catalog";
import type { Tables } from "./database.types";
import { check, db, fetchAll, maybe, must } from "./supabase";

const ROUND_LIFETIME_MS = 60 * 60 * 1000;
// Used if metrics.json has no duration for a clip. It gives the longest possible check.
const UNKNOWN_DURATION_MS = Number.POSITIVE_INFINITY;

export type Round = Tables<"rounds">;

export type RoundResult =
  | { status: "ready"; round: Round; text: string }
  /** The rater voted on every comparison. */
  | { status: "done" }
  /** There are fewer than two active models that share an item. */
  | { status: "unavailable" };

async function durationMs(model: string, itemId: string): Promise<number> {
  const metrics = await loadMetrics(model).catch(() => null);
  const seconds = metrics?.items[itemId]?.duration_s;
  return seconds === undefined ? UNKNOWN_DURATION_MS : seconds * 1000;
}

/**
 * Returns the open round of the rater, or starts a new one. A reload gets the same
 * samples, so a rater can't skip a comparison until a preferred pair appears.
 */
export async function openRound(rater: { id: string; email: string }): Promise<RoundResult> {
  const database = db();
  check(await database.from("raters").upsert({ id: rater.id, email: rater.email }, { onConflict: "id" }));

  const dataset = await loadDataset();
  const models = must(await database.from("models").select("name, item_ids").is("paused_at", null));
  const active = new Set(models.map((model) => model.name));

  const open = maybe(await database.from("rounds").select("*").eq("rater_id", rater.id).maybeSingle());
  if (open) {
    const text = dataset.get(open.item_id);
    if (text !== undefined && Date.parse(open.expires_at) > Date.now() && active.has(open.model_a) && active.has(open.model_b)) {
      return { status: "ready", round: open, text };
    }
    check(await database.from("rounds").delete().eq("id", open.id));
  }

  const voted = await fetchAll((from, to) =>
    database.from("votes").select("item_id, winner, loser").eq("rater_id", rater.id).order("id").range(from, to),
  );
  const candidates = models.map((model) => ({ name: model.name, itemIds: model.item_ids }));
  const known = new Set(dataset.keys());
  const comparison = pickComparison(
    candidates,
    voted.map((vote) => ({ itemId: vote.item_id, winner: vote.winner, loser: vote.loser })),
    known,
  );
  if (!comparison) return { status: pickComparison(candidates, [], known) ? "done" : "unavailable" };

  const [durationA, durationB] = await Promise.all([
    durationMs(comparison.modelA, comparison.itemId),
    durationMs(comparison.modelB, comparison.itemId),
  ]);
  const inserted = await database
    .from("rounds")
    .insert({
      rater_id: rater.id,
      item_id: comparison.itemId,
      model_a: comparison.modelA,
      model_b: comparison.modelB,
      required_listen_ms: requiredListenMs(durationA, durationB),
      expires_at: new Date(Date.now() + ROUND_LIFETIME_MS).toISOString(),
    })
    .select()
    .single();
  // Two tabs can start a round at the same time. The unique rater_id keeps one of them.
  if (inserted.error?.code === "23505") return openRound(rater);
  const round = must(inserted);
  return { status: "ready", round, text: dataset.get(round.item_id) ?? "" };
}
