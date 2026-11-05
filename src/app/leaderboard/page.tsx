import { formatPercent } from "@/lib/format";
import { currentUser } from "@/server/auth";
import { getI18n } from "@/server/i18n";
import { loadResults } from "@/server/results";
import { loadSettings } from "@/server/settings";

export default async function LeaderboardPage() {
  const [{ t }, settings, user] = await Promise.all([getI18n(), loadSettings(), currentUser()]);
  const text = t.leaderboard;

  if (!settings.leaderboardPublic && !user?.isAdmin) {
    return <p className="py-16 text-center text-ink-2">{text.private}</p>;
  }

  const { rows } = await loadResults();
  const active = rows.filter((row) => !row.paused);

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
                <th scope="col">{text.rank}</th>
                <th scope="col">{text.model}</th>
                <th scope="col" className="num">{text.rating}</th>
                <th scope="col" className="num">{text.winRate}</th>
                <th scope="col" className="num">{text.votes}</th>
                <th scope="col" className="num">{text.wer}</th>
                <th scope="col" className="num">{text.cer}</th>
              </tr>
            </thead>
            <tbody>
              {active.map((row, index) => (
                <tr key={row.name}>
                  <td className="text-ink-3">{index + 1}</td>
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
