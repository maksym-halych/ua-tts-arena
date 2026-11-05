import { describe, expect, test } from "bun:test";
import { computeStandings, headToHead } from "./standings";

describe("computeStandings", () => {
  test("puts a model with no votes last, not first", () => {
    const standings = computeStandings(
      ["new", "a", "b"],
      [
        { winner: "a", loser: "b", wins: 30 },
        { winner: "b", loser: "a", wins: 10 },
      ],
    );
    expect(standings.map((row) => row.name)).toEqual(["a", "b", "new"]);
    expect(standings[2]).toMatchObject({ rating: 1500, uncertainty: 0, games: 0, winRate: null });
  });

  test("reports wins, games and win rate", () => {
    const standings = computeStandings(
      ["a", "b"],
      [
        { winner: "a", loser: "b", wins: 3 },
        { winner: "b", loser: "a", wins: 1 },
      ],
    );
    expect(standings[0]).toMatchObject({ name: "a", wins: 3, games: 4, winRate: 0.75 });
    expect(standings[0]!.uncertainty).toBeGreaterThan(0);
  });

  test("leaves out tallies for unknown models", () => {
    const standings = computeStandings(["a", "b"], [{ winner: "a", loser: "gone", wins: 5 }]);
    expect(standings.every((row) => row.games === 0)).toBe(true);
  });

  test("works with no models and with no votes", () => {
    expect(computeStandings([], [])).toEqual([]);
    expect(computeStandings(["b", "a"], []).map((row) => row.name)).toEqual(["a", "b"]);
  });
});

describe("headToHead", () => {
  const tallies = [
    { winner: "a", loser: "b", wins: 3 },
    { winner: "b", loser: "a", wins: 1 },
    { winner: "a", loser: "c", wins: 9 },
  ];

  test("counts both directions", () => {
    expect(headToHead(tallies, "a", "b")).toEqual({ wins: 3, games: 4 });
    expect(headToHead(tallies, "b", "a")).toEqual({ wins: 1, games: 4 });
    expect(headToHead(tallies, "b", "c")).toEqual({ wins: 0, games: 0 });
  });
});
