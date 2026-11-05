import { describe, expect, test } from "bun:test";
import { sessionCookieOptions } from "./session-cookie";

describe("sessionCookieOptions", () => {
  test("keeps the options and hides the cookie from scripts", () => {
    expect(sessionCookieOptions({ path: "/", sameSite: "lax" }, "http://localhost:3000")).toEqual({
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: false,
    });
  });

  test("marks the cookie secure on https", () => {
    expect(sessionCookieOptions({}, "https://arena.example").secure).toBe(true);
    expect(sessionCookieOptions({}, undefined).secure).toBe(false);
  });
});
