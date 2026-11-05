import { describe, expect, test } from "bun:test";
import { pickComparison } from "./pick-comparison";

const known = new Set(["i1", "i2", "i3"]);

describe("pickComparison", () => {
  test("uses only items that both models have", () => {
    const models = [
      { name: "a", itemIds: ["i1", "i2"] },
      { name: "b", itemIds: ["i2", "i3"] },
    ];
    for (let run = 0; run < 50; run++) {
      expect(pickComparison(models, [], known)?.itemId).toBe("i2");
    }
  });

  test("skips items that the dataset does not know", () => {
    const models = [
      { name: "a", itemIds: ["i1", "gone"] },
      { name: "b", itemIds: ["i1", "gone"] },
    ];
    for (let run = 0; run < 50; run++) {
      expect(pickComparison(models, [], known)?.itemId).toBe("i1");
    }
  });

  test("skips a combination the rater voted on, in either order", () => {
    const models = [
      { name: "a", itemIds: ["i1", "i2"] },
      { name: "b", itemIds: ["i1", "i2"] },
    ];
    const voted = [{ itemId: "i1", winner: "b", loser: "a" }];
    for (let run = 0; run < 50; run++) {
      expect(pickComparison(models, voted, known)?.itemId).toBe("i2");
    }
  });

  test("returns null when nothing is left", () => {
    const models = [
      { name: "a", itemIds: ["i1"] },
      { name: "b", itemIds: ["i1"] },
    ];
    expect(pickComparison(models, [{ itemId: "i1", winner: "a", loser: "b" }], known)).toBeNull();
    expect(pickComparison([models[0]!], [], known)).toBeNull();
    expect(pickComparison([], [], known)).toBeNull();
  });

  test("reaches every pair and both sides", () => {
    const models = ["a", "b", "c"].map((name) => ({ name, itemIds: ["i1"] }));
    const seen = new Set<string>();
    for (let run = 0; run < 500; run++) {
      const picked = pickComparison(models, [], known)!;
      expect(picked.modelA).not.toBe(picked.modelB);
      seen.add(`${picked.modelA}-${picked.modelB}`);
    }
    expect(seen.size).toBe(6);
  });
});
