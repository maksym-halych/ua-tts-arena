import { describe, expect, test } from "bun:test";
import { pickAfterSkip, pickComparison } from "./pick-comparison";

const known = new Set(["i1", "i2", "i3"]);

describe("pickAfterSkip", () => {
  const models = [
    { name: "a", itemIds: ["i1", "i2"] },
    { name: "b", itemIds: ["i1", "i2"] },
  ];

  test("picks a different item if one is left", () => {
    for (let run = 0; run < 50; run++) {
      expect(pickAfterSkip("i1", models, [], known)?.itemId).toBe("i2");
    }
  });

  test("does not pick another model pair for the skipped item", () => {
    const three = [...models, { name: "c", itemIds: ["i1"] }];
    for (let run = 0; run < 50; run++) {
      expect(pickAfterSkip("i1", three, [], known)?.itemId).toBe("i2");
    }
  });

  test("picks the skipped item again if nothing else is left", () => {
    const voted = [{ itemId: "i2", winner: "a", loser: "b" }];
    expect(pickAfterSkip("i1", models, voted, known)?.itemId).toBe("i1");
  });

  test("returns null if the rater voted on everything", () => {
    const voted = [
      { itemId: "i1", winner: "a", loser: "b" },
      { itemId: "i2", winner: "b", loser: "a" },
    ];
    expect(pickAfterSkip("i1", models, voted, known)).toBeNull();
  });
});

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
