import { describe, expect, test } from "bun:test";
import { averageMetrics, checkFolder } from "./model-folder";

const manifest = { format_version: 1, dataset_md5: "x", items: { i1: { synthesis_time_s: 1 }, i2: { synthesis_time_s: 1 } } };
const metrics = {
  format_version: 1,
  items: {
    i1: { transcript: "t", wer: 0, cer: 0.1, duration_s: 2, rtf: 0.5 },
    i2: { transcript: "t", wer: 0.5, cer: 0.3, duration_s: 3, rtf: 0.5 },
  },
};
const dataset = new Set(["i1", "i2"]);

describe("checkFolder", () => {
  test("accepts a complete folder", () => {
    const check = checkFolder("holos", { manifest, metrics, mp3Ids: ["i1", "i2"] }, dataset);
    expect(check.problems).toEqual([]);
    expect(check.notes).toEqual([]);
    expect(check.itemIds).toEqual(["i1", "i2"]);
  });

  test("reports each missing part", () => {
    const check = checkFolder("holos", { manifest: undefined, metrics: undefined, mp3Ids: [] }, dataset);
    expect(check.problems).toHaveLength(3);
  });

  test("rejects a wrong format and a bad name", () => {
    const check = checkFolder(".hidden", { manifest: { items: 1 }, metrics: { format_version: 2 }, mp3Ids: ["i1"] }, dataset);
    expect(check.problems).toEqual([
      "The folder name has characters that are not allowed.",
      "manifest.json has an incorrect format.",
      "metrics.json has an incorrect format.",
    ]);
  });

  test("rejects MP3 files that the manifest does not list", () => {
    const check = checkFolder("holos", { manifest, metrics, mp3Ids: ["i1", "stale"] }, dataset);
    expect(check.problems).toEqual(["1 MP3 files are not in manifest.json. Run export_mp3 again."]);
  });

  test("allows a skipped clip and notes it", () => {
    const check = checkFolder("holos", { manifest, metrics, mp3Ids: ["i1"] }, dataset);
    expect(check.problems).toEqual([]);
    expect(check.notes).toEqual(["1 of 2 generated items have no MP3 copy. See bench.log."]);
  });

  test("notes items outside the dataset", () => {
    const check = checkFolder("holos", { manifest, metrics, mp3Ids: ["i1", "i2"] }, new Set(["i1"]));
    expect(check.problems).toEqual([]);
    expect(check.notes).toEqual(["1 MP3 files are not in the dataset. Raters will not get these items."]);
  });
});

describe("averageMetrics", () => {
  test("averages each metric", () => {
    const averages = averageMetrics(metrics as never)!;
    expect(averages.wer).toBeCloseTo(0.25);
    expect(averages.cer).toBeCloseTo(0.2);
  });

  test("is null with no items", () => {
    expect(averageMetrics({ format_version: 1, items: {} })).toBeNull();
  });
});
