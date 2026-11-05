import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hfSource, localSource, parseSource } from "./model-source";

const decode = (bytes: Uint8Array | null) => (bytes ? new TextDecoder().decode(bytes) : null);

describe("localSource", () => {
  let root = "";

  test("reads folders and files, and returns nothing for missing ones", async () => {
    root = await mkdtemp(join(tmpdir(), "arena-source-"));
    await mkdir(join(root, "holos", "mp3"), { recursive: true });
    await writeFile(join(root, "holos", "mp3", "aaa.mp3"), "audio");
    await writeFile(join(root, "holos", "manifest.json"), "{}");
    await writeFile(join(root, "stray.txt"), "x");

    const source = localSource(root);
    expect(await source.listFolders()).toEqual(["holos"]);
    expect(await source.listFiles("holos/mp3")).toEqual(["aaa.mp3"]);
    expect(await source.listFiles("omnivoice/mp3")).toEqual([]);
    expect(decode(await source.readFile("holos/mp3/aaa.mp3"))).toBe("audio");
    expect(await source.readFile("holos/none.json")).toBeNull();
    expect(await source.readFile("holos/mp3")).toBeNull();
  });

  afterAll(async () => {
    if (root) await rm(root, { recursive: true });
  });
});

describe("hfSource", () => {
  const seen: { path: string; auth: string | null }[] = [];
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      seen.push({ path: url.pathname, auth: request.headers.get("authorization") });
      if (url.pathname === "/api/datasets/me/ds/tree/main") {
        return Response.json([
          { type: "directory", path: "holos" },
          { type: "file", path: "README.md" },
        ]);
      }
      if (url.pathname === "/api/datasets/me/ds/tree/main/holos/mp3") {
        if (url.searchParams.get("cursor") === "2") return Response.json([{ type: "file", path: "holos/mp3/b.mp3" }]);
        return Response.json([{ type: "file", path: "holos/mp3/a.mp3" }], {
          headers: { Link: `<${url.origin}${url.pathname}?cursor=2>; rel="next"` },
        });
      }
      if (url.pathname === "/datasets/me/ds/resolve/main/holos/manifest.json") return new Response("{}");
      if (url.pathname === "/datasets/me/ds/resolve/main/broken.json") return new Response("no", { status: 500 });
      return new Response("not found", { status: 404 });
    },
  });
  const source = hfSource("me/ds", "secret", server.url.origin);

  test("lists only folders at the root", async () => {
    expect(await source.listFolders()).toEqual(["holos"]);
  });

  test("follows pages and keeps only the file names", async () => {
    expect(await source.listFiles("holos/mp3")).toEqual(["a.mp3", "b.mp3"]);
  });

  test("treats a missing folder or file as empty", async () => {
    expect(await source.listFiles("omnivoice/mp3")).toEqual([]);
    expect(await source.readFile("holos/none.json")).toBeNull();
  });

  test("reads a file and sends the token", async () => {
    expect(decode(await source.readFile("holos/manifest.json"))).toBe("{}");
    expect(seen.every((request) => request.auth === "Bearer secret")).toBe(true);
  });

  test("raises an error when the server fails", async () => {
    await expect(source.readFile("broken.json")).rejects.toThrow("500");
  });

  afterAll(() => server.stop());
});

describe("parseSource", () => {
  test("rejects a bad dataset name", () => {
    expect(() => parseSource("hf://datasets/../secret")).toThrow("incorrect dataset name");
  });

  test("accepts both forms", () => {
    expect(parseSource("hf://datasets/me/ds")).toBeDefined();
    expect(parseSource("./data")).toBeDefined();
  });
});
