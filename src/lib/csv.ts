type Cell = string | number | boolean | null;

// A spreadsheet runs a cell that starts with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: Cell): string {
  if (value === null) return "";
  const text = String(value);
  if (typeof value !== "string") return text;
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
