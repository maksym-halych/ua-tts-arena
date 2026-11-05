import { formatDate, formatPercent, formatSeconds } from "@/lib/format";
import { computeRaterStats } from "@/lib/rater-stats";
import { requireAdmin } from "@/server/auth";
import { db, fetchAll, must } from "@/server/supabase";
import { excludeRater, restoreRater } from "./actions";

export default async function RatersPage() {
  await requireAdmin();
  const database = db();
  const raters = must(await database.from("raters").select("*").order("created_at"));
  const votes = await fetchAll((from, to) =>
    database
      .from("votes")
      .select("rater_id, item_id, winner, loser, chosen_side, decision_ms, excluded_at")
      .order("id")
      .range(from, to),
  );

  const excludedRaters = new Set(raters.filter((rater) => rater.excluded_at).map((rater) => rater.id));
  const stats = computeRaterStats(
    votes.map((vote) => ({
      raterId: vote.rater_id,
      itemId: vote.item_id,
      winner: vote.winner,
      loser: vote.loser,
      chosenSide: vote.chosen_side as "a" | "b",
      decisionMs: vote.decision_ms,
      counted: !vote.excluded_at && !excludedRaters.has(vote.rater_id),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raters</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-2">
          Excluding a rater removes all of their votes from the results, including later votes. Restoring puts the votes back, but not votes excluded one at a time. Agreement compares a rater with the majority of the other raters on the same item and pair.
        </p>
      </div>
      <section className="card overflow-x-auto">
        {raters.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">There are no raters yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Rater</th>
                <th scope="col" className="num">Votes</th>
                <th scope="col" className="num">Typical decision</th>
                <th scope="col" className="num">Side A</th>
                <th scope="col" className="num">Agreement</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {raters.map((rater) => {
                const row = stats.get(rater.id);
                return (
                  <tr key={rater.id}>
                    <td className="font-medium">{rater.email}</td>
                    <td className="num">{row?.votes ?? 0}</td>
                    <td className="num">{formatSeconds(row?.medianDecisionMs)}</td>
                    <td className="num">{formatPercent(row?.sideAShare)}</td>
                    <td className="num">
                      {formatPercent(row?.agreement)}
                      {row && row.agreementVotes > 0 && <span className="text-ink-3"> ({row.agreementVotes})</span>}
                    </td>
                    <td>
                      {rater.excluded_at ? (
                        <form action={restoreRater} className="flex flex-col items-start gap-1">
                          <input type="hidden" name="id" value={rater.id} />
                          <span className="text-danger">
                            Excluded {formatDate(rater.excluded_at)}: {rater.excluded_reason}
                          </span>
                          <button className="btn">Restore</button>
                        </form>
                      ) : (
                        <form action={excludeRater} className="flex gap-2">
                          <input type="hidden" name="id" value={rater.id} />
                          <input name="reason" required maxLength={500} placeholder="Reason" aria-label={`Reason to exclude ${rater.email}`} className="input w-40" />
                          <button className="btn">Exclude</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
