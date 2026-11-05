import { toCsv } from "@/lib/csv";
import { requireAdmin } from "@/server/auth";
import { db, fetchAll } from "@/server/supabase";

/** All votes, also excluded ones. Rater ids stand in for email addresses, so the file can be shared. */
export async function GET() {
  await requireAdmin();
  const votes = await fetchAll((from, to) =>
    db().from("votes").select("*, raters(excluded_at, excluded_reason)").order("id").range(from, to),
  );
  const csv = toCsv(
    [
      "id",
      "created_at",
      "rater_id",
      "item_id",
      "winner",
      "loser",
      "chosen_side",
      "decision_ms",
      "models_shown",
      "excluded_at",
      "excluded_reason",
      "rater_excluded_at",
      "rater_excluded_reason",
    ],
    votes.map((vote) => [
      vote.id,
      vote.created_at,
      vote.rater_id,
      vote.item_id,
      vote.winner,
      vote.loser,
      vote.chosen_side,
      vote.decision_ms,
      vote.models_shown,
      vote.excluded_at,
      vote.excluded_reason,
      vote.raters.excluded_at,
      vote.raters.excluded_reason,
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="votes.csv"',
      "Cache-Control": "no-store",
    },
  });
}
