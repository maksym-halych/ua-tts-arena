import { formatPercent, formatRtf } from "@/lib/format";
import { headToHead } from "@/lib/standings";
import { requireAdmin } from "@/server/auth";
import { loadResults } from "@/server/results";

export default async function ResultsPage() {
  await requireAdmin();
  const { rows, tallies } = await loadResults();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Results</h1>

      <section className="card overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-ink-2">No model is registered.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Model</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">Rating</th>
                <th scope="col" className="num">Win rate</th>
                <th scope="col" className="num">Votes</th>
                <th scope="col" className="num">Avg WER</th>
                <th scope="col" className="num">Avg CER</th>
                <th scope="col" className="num">Avg RTF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.name}>
                  <td className="text-ink-3">{index + 1}</td>
                  <td className="font-medium">{row.name}</td>
                  <td>{row.paused ? "Paused" : "Active"}</td>
                  <td className="num">{row.games > 0 ? `${row.rating} ± ${row.uncertainty}` : "—"}</td>
                  <td className="num">{formatPercent(row.winRate)}</td>
                  <td className="num">{row.games}</td>
                  <td className="num">{formatPercent(row.metrics?.wer)}</td>
                  <td className="num">{formatPercent(row.metrics?.cer)}</td>
                  <td className="num">{formatRtf(row.metrics?.rtf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {rows.length > 1 && (
        <section className="card overflow-x-auto">
          <h2 className="p-5 pb-1 font-semibold">Head to head</h2>
          <p className="px-5 pb-2 text-sm text-ink-2">Each cell shows the wins of the row model against the column model, and the total votes for that pair.</p>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Model</th>
                {rows.map((row) => (
                  <th key={row.name} scope="col" className="num">
                    {row.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  {rows.map((column) => {
                    if (column.name === row.name) {
                      return (
                        <td key={column.name} className="num text-ink-3">
                          —
                        </td>
                      );
                    }
                    const result = headToHead(tallies, row.name, column.name);
                    return (
                      <td key={column.name} className="num">
                        {result.wins} / {result.games}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
