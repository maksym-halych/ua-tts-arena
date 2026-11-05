import { describe, expect, test } from "bun:test";
import { parseSortKey, sortRows } from "./leaderboard-sort";

const rows = [
  { name: "a", rating: 1500, games: 40, winRate: 0.5, metrics: { wer: 0.3, cer: 0.1 } },
  { name: "b", rating: 1600, games: 4, winRate: 0.75, metrics: { wer: 0.1, cer: 0.2 } },
  { name: "c", rating: 1400, games: 40, winRate: 0.25, metrics: null },
  { name: "new", rating: 1500, games: 0, winRate: null, metrics: { wer: 0.2, cer: 0.05 } },
];

function order(key: Parameters<typeof sortRows>[1]): string[] {
  return sortRows(rows, key).map((row) => row.name);
}

describe("sortRows", () => {
  test("keeps the given order for the rank", () => {
    expect(order("rank")).toEqual(["a", "b", "c", "new"]);
  });

  test("puts the highest rating and win rate first", () => {
    expect(order("rating")).toEqual(["b", "a", "c", "new"]);
    expect(order("winRate")).toEqual(["b", "a", "c", "new"]);
  });

  test("puts the lowest WER and CER first", () => {
    expect(order("wer")).toEqual(["b", "new", "a", "c"]);
    expect(order("cer")).toEqual(["new", "a", "b", "c"]);
  });

  test("keeps the given order for equal values", () => {
    const equal = [
      { name: "first", rating: 1500, games: 1, winRate: 0.5, metrics: null },
      { name: "second", rating: 1500, games: 1, winRate: 0.5, metrics: null },
    ];
    expect(sortRows(equal, "rating").map((row) => row.name)).toEqual(["first", "second"]);
    expect(sortRows(equal, "wer").map((row) => row.name)).toEqual(["first", "second"]);
  });

  test("does not change the given array", () => {
    const names = rows.map((row) => row.name);
    sortRows(rows, "wer");
    expect(rows.map((row) => row.name)).toEqual(names);
  });
});

describe("parseSortKey", () => {
  test("accepts a known key", () => {
    expect(parseSortKey("wer")).toBe("wer");
  });

  test("uses the rank for anything else", () => {
    expect(parseSortKey(undefined)).toBe("rank");
    expect(parseSortKey("name")).toBe("rank");
    expect(parseSortKey(["wer", "cer"])).toBe("rank");
  });
});
