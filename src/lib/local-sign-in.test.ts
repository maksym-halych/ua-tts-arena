import { describe, expect, test } from "bun:test";
import { isLocalSignInAllowed } from "./local-sign-in";

describe("isLocalSignInAllowed", () => {
  test("needs the flag and a database on this machine", () => {
    expect(isLocalSignInAllowed("true", "http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSignInAllowed("true", "http://localhost:54321")).toBe(true);
    expect(isLocalSignInAllowed("true", "http://[::1]:54321")).toBe(true);
  });

  test("stays off without the flag", () => {
    expect(isLocalSignInAllowed(undefined, "http://127.0.0.1:54321")).toBe(false);
    expect(isLocalSignInAllowed("false", "http://127.0.0.1:54321")).toBe(false);
    expect(isLocalSignInAllowed("1", "http://127.0.0.1:54321")).toBe(false);
  });

  test("stays off with a hosted database, even with the flag", () => {
    expect(isLocalSignInAllowed("true", "https://abc.supabase.co")).toBe(false);
    expect(isLocalSignInAllowed("true", "https://127.0.0.1.example.com")).toBe(false);
    expect(isLocalSignInAllowed("true", "https://localhost.example.com")).toBe(false);
  });
});
