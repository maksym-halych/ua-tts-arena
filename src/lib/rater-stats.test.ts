import { describe, expect, test } from "bun:test";
import { computeRaterStats, type RaterVote } from "./rater-stats";

function vote(raterId: string, itemId: string, winner: string, loser: string, extra: Partial<RaterVote> = {}): RaterVote {
  return { raterId, itemId, winner, loser, chosenSide: "a", decisionMs: 1000, counted: true, ...extra };
}

describe("computeRaterStats", () => {
  test("computes the median decision time and side share", () => {
    const stats = computeRaterStats([
      vote("r", "i1", "a", "b", { decisionMs: 1000, chosenSide: "a" }),
      vote("r", "i2", "a", "b", { decisionMs: 3000, chosenSide: "b" }),
      vote("r", "i3", "a", "b", { decisionMs: 9000, chosenSide: "b" }),
    ]).get("r")!;
    expect(stats.votes).toBe(3);
    expect(stats.medianDecisionMs).toBe(3000);
    expect(stats.sideAShare).toBeCloseTo(1 / 3);
  });

  test("compares each rater with the majority of the others", () => {
    const stats = computeRaterStats([
      vote("r1", "i1", "a", "b"),
      vote("r2", "i1", "a", "b"),
      vote("r3", "i1", "b", "a"),
    ]);
    expect(stats.get("r1")).toMatchObject({ agreement: null, agreementVotes: 0 });
    expect(stats.get("r3")).toMatchObject({ agreement: 0, agreementVotes: 1 });
  });

  test("counts agreement in either model order", () => {
    const stats = computeRaterStats([vote("r1", "i1", "a", "b"), vote("r2", "i1", "a", "b"), vote("r3", "i1", "a", "b")]);
    expect(stats.get("r1")).toMatchObject({ agreement: 1, agreementVotes: 1 });
  });

  test("gives no agreement value with no other votes", () => {
    expect(computeRaterStats([vote("r", "i1", "a", "b")]).get("r")!.agreement).toBeNull();
  });

  test("leaves excluded votes out of the majority", () => {
    const stats = computeRaterStats([
      vote("r1", "i1", "a", "b"),
      vote("r2", "i1", "b", "a", { counted: false }),
      vote("r3", "i1", "b", "a", { counted: false }),
      vote("r4", "i1", "a", "b"),
    ]);
    expect(stats.get("r1")).toMatchObject({ agreement: 1, agreementVotes: 1 });
    expect(stats.get("r2")).toMatchObject({ agreement: 0, agreementVotes: 1 });
  });
});
