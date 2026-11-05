import { describe, expect, test } from "bun:test";
import { toCsv } from "./csv";

describe("toCsv", () => {
  test("writes values and leaves null empty", () => {
    expect(toCsv(["a", "b", "c"], [[1, true, null]])).toBe("a,b,c\r\n1,true,\r\n");
  });

  test("quotes commas, quotes and line breaks", () => {
    expect(toCsv(["reason"], [['too "fast", bot']])).toBe('reason\r\n"too ""fast"", bot"\r\n');
    expect(toCsv(["reason"], [["two\nlines"]])).toBe('reason\r\n"two\nlines"\r\n');
  });

  test("stops a spreadsheet from running a reason as a formula", () => {
    expect(toCsv(["reason"], [["=HYPERLINK(1)"]])).toBe("reason\r\n'=HYPERLINK(1)\r\n");
    expect(toCsv(["n"], [[-1]])).toBe("n\r\n-1\r\n");
  });
});
