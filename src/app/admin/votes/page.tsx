import Link from "next/link";
import { z } from "zod";
import { formatDate, formatSeconds } from "@/lib/format";
import { isItemId, isModelName } from "@/lib/names";
import { requireAdmin } from "@/server/auth";
import { loadDataset } from "@/server/catalog";
import { db, must } from "@/server/supabase";
import { excludeVote, restoreVote } from "./actions";

const PAGE_SIZE = 50;

const raterId = z.uuid();

function clean(params: { rater?: string; model?: string; item?: string; page?: string }) {
  return {
    rater: raterId.safeParse(params.rater).data,
    // Only a valid name reaches the "or" filter below, which is a text expression.
    model: params.model && isModelName(params.model) ? params.model : undefined,
    item: params.item && isItemId(params.item) ? params.item : undefined,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
}

export default async function VotesPage({
  searchParams,
}: {
  searchParams: Promise<{ rater?: string; model?: string; item?: string; page?: string }>;
}) {
  await requireAdmin();
  const filter = clean(await searchParams);
  const database = db();

  let query = database
    .from("votes")
    .select("*, raters(email, excluded_at)", { count: "exact" })
    .order("id", { ascending: false })
    .range((filter.page - 1) * PAGE_SIZE, filter.page * PAGE_SIZE - 1);
  if (filter.rater) query = query.eq("rater_id", filter.rater);
  if (filter.model) query = query.or(`winner.eq.${filter.model},loser.eq.${filter.model}`);
  if (filter.item) query = query.eq("item_id", filter.item);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const votes = data ?? [];

  const [raters, models, dataset] = await Promise.all([
    database.from("raters").select("id, email").order("email"),
    database.from("models").select("name").order("name"),
    loadDataset(),
  ]);

  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    if (filter.rater) params.set("rater", filter.rater);
    if (filter.model) params.set("model", filter.model);
    if (filter.item) params.set("item", filter.item);
    params.set("page", String(page));
    return `/admin/votes?${params}`;
  };
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Votes</h1>
        <a href="/admin/votes/export" className="btn" download>
          Export all votes as CSV
        </a>
      </div>

      <form method="get" className="card flex flex-wrap items-end gap-3 p-4 text-sm">
        <label className="flex flex-col gap-1">
          Rater
          <select name="rater" defaultValue={filter.rater ?? ""} className="input">
            <option value="">All</option>
            {must(raters).map((rater) => (
              <option key={rater.id} value={rater.id}>
                {rater.email}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Model
          <select name="model" defaultValue={filter.model ?? ""} className="input">
            <option value="">All</option>
            {must(models).map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Item id
          <input name="item" defaultValue={filter.item ?? ""} pattern="[0-9a-f]{12}" className="input w-40 font-mono" />
        </label>
        <button className="btn">Filter</button>
        <Link href="/admin/votes" className="btn bg-transparent">
          Clear
        </Link>
      </form>

      <section className="card overflow-x-auto">
        {votes.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">No votes match.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Rater</th>
                <th scope="col">Item</th>
                <th scope="col">Winner</th>
                <th scope="col">Loser</th>
                <th scope="col">Side</th>
                <th scope="col" className="num">Decision</th>
                <th scope="col">Names shown</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote) => (
                <tr key={vote.id}>
                  <td className="whitespace-nowrap">{formatDate(vote.created_at)}</td>
                  <td>{vote.raters.email}</td>
                  <td className="min-w-56">
                    <span className="tag">{vote.item_id}</span>
                    <p lang="uk">{dataset.get(vote.item_id) ?? "Not in the dataset"}</p>
                  </td>
                  <td className="font-medium">{vote.winner}</td>
                  <td>{vote.loser}</td>
                  <td className="uppercase">{vote.chosen_side}</td>
                  <td className="num">{formatSeconds(vote.decision_ms)}</td>
                  <td>{vote.models_shown ? "Yes" : "No"}</td>
                  <td>
                    {vote.raters.excluded_at && <p className="mb-1 text-danger">Rater excluded</p>}
                    {vote.excluded_at ? (
                      <form action={restoreVote} className="flex flex-col items-start gap-1">
                        <input type="hidden" name="id" value={vote.id} />
                        <span className="text-danger">
                          Excluded {formatDate(vote.excluded_at)}: {vote.excluded_reason}
                        </span>
                        <button className="btn">Restore</button>
                      </form>
                    ) : (
                      <form action={excludeVote} className="flex gap-2">
                        <input type="hidden" name="id" value={vote.id} />
                        <input name="reason" required maxLength={500} placeholder="Reason" aria-label={`Reason to exclude vote ${vote.id}`} className="input w-32" />
                        <button className="btn">Exclude</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex items-center justify-between text-sm text-ink-2">
        <span>
          {count ?? 0} votes, page {filter.page} of {lastPage}
        </span>
        <div className="flex gap-2">
          {filter.page > 1 && (
            <Link href={pageLink(filter.page - 1)} className="btn">
              Previous
            </Link>
          )}
          {filter.page < lastPage && (
            <Link href={pageLink(filter.page + 1)} className="btn">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
