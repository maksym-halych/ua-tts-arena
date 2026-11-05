import Link from "next/link";
import { formatPercent } from "@/lib/format";
import { lowerIsBetter, parseSortKey, sortRows, type SortKey } from "@/lib/leaderboard-sort";
import { currentUser } from "@/server/auth";
import { getI18n } from "@/server/i18n";
import { loadResults } from "@/server/results";
import { loadSettings } from "@/server/settings";

function SortHeader({ column, active, label, numeric }: { column: SortKey; active: SortKey; label: string; numeric?: boolean }) {
  const isActive = column === active;
  const ascending = lowerIsBetter(column);
  return (
    <th
      scope="col"
      className={numeric ? "num" : undefined}
      aria-sort={isActive ? (ascending ? "ascending" : "descending") : undefined}
    >
      <Link
        href={column === "rank" ? "/leaderboard" : `/leaderboard?sort=${column}`}
        scroll={false}
        className={`inline-flex items-center gap-1 hover:text-ink ${isActive ? "font-semibold text-ink" : ""}`}
      >
        {label}
        <span aria-hidden="true" className={isActive ? "" : "text-ink-3"}>
          {isActive ? (ascending ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ sort?: string | string[] }> }) {
  const [{ t }, settings, user, params] = await Promise.all([getI18n(), loadSettings(), currentUser(), searchParams]);
  const text = t.leaderboard;

  if (!settings.leaderboardPublic && !user?.isAdmin) {
    return <p className="py-16 text-center text-ink-2">{text.private}</p>;
  }

  const { rows } = await loadResults();
  const sort = parseSortKey(params.sort);
  // The rank stays with the model in each order. It always comes from the rating fit.
  const ranked = rows.filter((row) => !row.paused).map((row, index) => ({ ...row, rank: index + 1 }));
  const active = sortRows(ranked, sort);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-2">{text.intro}</p>
      </div>
      {active.length === 0 ? (
        <p className="card p-8 text-center text-ink-2">{text.empty}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <SortHeader column="rank" active={sort} label={text.rank} />
                <th scope="col">{text.model}</th>
                <SortHeader column="rating" active={sort} label={text.rating} numeric />
                <SortHeader column="winRate" active={sort} label={text.winRate} numeric />
                <th scope="col" className="num">{text.votes}</th>
                <SortHeader column="wer" active={sort} label={text.wer} numeric />
                <SortHeader column="cer" active={sort} label={text.cer} numeric />
              </tr>
            </thead>
            <tbody>
              {active.map((row) => (
                <tr key={row.name}>
                  <td className="text-ink-3">{row.rank}</td>
                  <td className="font-medium">{row.name}</td>
                  <td className="num">{row.games > 0 ? `${row.rating} ± ${row.uncertainty}` : "—"}</td>
                  <td className="num">{formatPercent(row.winRate)}</td>
                  <td className="num">{row.games}</td>
                  <td className="num">{formatPercent(row.metrics?.wer)}</td>
                  <td className="num">{formatPercent(row.metrics?.cer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink-3">{text.note}</p>
    </div>
  );
}
