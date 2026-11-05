import { requireAdmin } from "@/server/auth";
import { loadDataset } from "@/server/catalog";
import { db, fetchAll, must } from "@/server/supabase";
import { loadResults } from "@/server/results";
import { headToHead } from "@/lib/standings";

const DAYS_SHOWN = 14;
const NEEDS_VOTES_SHOWN = 10;

async function rowCount(query: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export default async function OverviewPage() {
  await requireAdmin();
  const database = db();
  const [allVotes, countedVotes, raters, daily, itemTallies, models, results, dataset] = await Promise.all([
    rowCount(database.from("votes").select("*", { count: "exact", head: true })),
    rowCount(database.from("counted_votes").select("*", { count: "exact", head: true })),
    rowCount(database.from("raters").select("*", { count: "exact", head: true })),
    database.from("daily_tallies").select("day, votes").order("day", { ascending: false }).limit(DAYS_SHOWN),
    fetchAll((from, to) => database.from("item_tallies").select("item_id, votes").order("item_id").range(from, to)),
    database.from("models").select("name, item_ids, paused_at"),
    loadResults(),
    loadDataset(),
  ]);

  const days = must(daily);
  const busiestDay = Math.max(1, ...days.map((day) => day.votes ?? 0));
  const active = must(models).filter((model) => !model.paused_at);

  const pairs = active
    .flatMap((first, index) =>
      active.slice(index + 1).map((second) => ({
        first: first.name,
        second: second.name,
        games: headToHead(results.tallies, first.name, second.name).games,
      })),
    )
    .sort((a, b) => a.games - b.games)
    .slice(0, NEEDS_VOTES_SHOWN);

  // An item can get votes only if at least two active models have it.
  const modelsPerItem = new Map<string, number>();
  for (const model of active) {
    for (const id of model.item_ids) modelsPerItem.set(id, (modelsPerItem.get(id) ?? 0) + 1);
  }
  const votesPerItem = new Map(itemTallies.map((tally) => [tally.item_id, tally.votes ?? 0]));
  const items = [...dataset.entries()]
    .filter(([id]) => (modelsPerItem.get(id) ?? 0) >= 2)
    .map(([id, text]) => ({ id, text, votes: votesPerItem.get(id) ?? 0 }))
    .sort((a, b) => a.votes - b.votes)
    .slice(0, NEEDS_VOTES_SHOWN);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Votes counted" value={countedVotes} />
        <Stat label="Votes excluded" value={allVotes - countedVotes} />
        <Stat label="Raters" value={raters} />
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Votes per day</h2>
        {days.length === 0 ? (
          <p className="text-sm text-ink-2">There are no votes yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {days.map((day) => (
              <li key={day.day} className="flex items-center gap-3 text-sm">
                <span className="tag w-20 shrink-0">{day.day}</span>
                <span className="h-2 rounded-full bg-accent" style={{ width: `${((day.votes ?? 0) / busiestDay) * 70}%` }} />
                <span className="tabular-nums">{day.votes}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <h2 className="p-5 pb-1 font-semibold">Model pairs that need votes</h2>
          {pairs.length === 0 ? (
            <p className="p-5 pt-2 text-sm text-ink-2">Add at least two models.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col" className="num">Votes</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair) => (
                  <tr key={`${pair.first}|${pair.second}`}>
                    <td>
                      {pair.first} / {pair.second}
                    </td>
                    <td className="num">{pair.games}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card overflow-x-auto">
          <h2 className="p-5 pb-1 font-semibold">Items that need votes</h2>
          {items.length === 0 ? (
            <p className="p-5 pt-2 text-sm text-ink-2">Add at least two models that share items.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="num">Votes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td lang="uk">{item.text}</td>
                    <td className="num">{item.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="tag">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
