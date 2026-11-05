import { describe, expect, test } from "bun:test";
import { listenedMs, requiredListenMs } from "./listening";

describe("requiredListenMs", () => {
  test("caps each clip at the minimum", () => {
    expect(requiredListenMs(10_000, 20_000)).toBe(6000);
  });

  test("uses the full length of a short clip", () => {
    expect(requiredListenMs(1200, 20_000)).toBe(4200);
    expect(requiredListenMs(100, 200)).toBe(300);
  });
});

describe("listenedMs", () => {
  test("is null until both clips are served", () => {
    expect(listenedMs(null, null, 0)).toBeNull();
    expect(listenedMs("2026-11-05T10:00:00Z", null, 0)).toBeNull();
    expect(listenedMs(null, "2026-11-05T10:00:00Z", 0)).toBeNull();
  });

  test("counts from the clip that was served last", () => {
    const now = Date.parse("2026-11-05T10:00:10Z");
    expect(listenedMs("2026-11-05T10:00:00Z", "2026-11-05T10:00:04Z", now)).toBe(6000);
    expect(listenedMs("2026-11-05T10:00:04Z", "2026-11-05T10:00:00Z", now)).toBe(6000);
  });
});
