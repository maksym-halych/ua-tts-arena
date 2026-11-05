import { describe, expect, test } from "bun:test";
import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  test("keeps a local path", () => {
    expect(safeNextPath("/admin/votes?model=holos")).toBe("/admin/votes?model=holos");
  });

  test("rejects anything that can leave the site", () => {
    for (const value of ["https://example.com", "//example.com", "/\\example.com", "example.com", "", null, undefined, 7]) {
      expect(safeNextPath(value)).toBe("/");
    }
  });
});
