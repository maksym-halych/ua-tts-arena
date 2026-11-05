import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * The folder of model folders. A local folder and the HF dataset have the same
 * layout, so the rest of the app doesn't know which one it uses.
 */
export type ModelSource = {
  /** Names of the folders at the root. */
  listFolders(): Promise<string[]>;
  /** Names of the files in a folder. Empty if the folder doesn't exist. */
  listFiles(path: string): Promise<string[]>;
  /** The content of a file, or null if the file doesn't exist. */
  readFile(path: string): Promise<Uint8Array | null>;
};

export function localSource(root: string): ModelSource {
  const base = resolve(root);
  return {
    async listFolders() {
      const entries = await readdir(base, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    },
    async listFiles(path) {
      try {
        const entries = await readdir(resolve(base, path), { withFileTypes: true });
        return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
      } catch (error) {
        if (isMissing(error)) return [];
        throw error;
      }
    },
    async readFile(path) {
      const file = resolve(base, path);
      try {
        if (!(await stat(file)).isFile()) return null;
        return await readFile(file);
      } catch (error) {
        if (isMissing(error)) return null;
        throw error;
      }
    },
  };
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

type TreeEntry = { type: string; path: string };

const NEXT_LINK = /<([^>]+)>;\s*rel="next"/;

export function hfSource(repo: string, token?: string, baseUrl = "https://huggingface.co"): ModelSource {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const encode = (path: string) => path.split("/").map(encodeURIComponent).join("/");

  async function listTree(path: string): Promise<TreeEntry[] | null> {
    const entries: TreeEntry[] = [];
    let url: string | null = `${baseUrl}/api/datasets/${repo}/tree/main${path ? `/${encode(path)}` : ""}`;
    while (url) {
      const response: Response = await fetch(url, { headers, cache: "no-store" });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Hugging Face returned ${response.status} for ${url}`);
      entries.push(...((await response.json()) as TreeEntry[]));
      url = response.headers.get("link")?.match(NEXT_LINK)?.[1] ?? null;
    }
    return entries;
  }

  const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

  return {
    async listFolders() {
      const entries = await listTree("");
      if (!entries) throw new Error(`Hugging Face dataset ${repo} not found`);
      return entries.filter((entry) => entry.type === "directory").map((entry) => baseName(entry.path));
    },
    async listFiles(path) {
      const entries = await listTree(path);
      return (entries ?? []).filter((entry) => entry.type === "file").map((entry) => baseName(entry.path));
    },
    async readFile(path) {
      const url = `${baseUrl}/datasets/${repo}/resolve/main/${encode(path)}`;
      const response = await fetch(url, { headers, cache: "no-store" });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Hugging Face returned ${response.status} for ${url}`);
      return new Uint8Array(await response.arrayBuffer());
    },
  };
}

const HF_PREFIX = "hf://datasets/";

/** Reads MODELS_SOURCE: either hf://datasets/<user>/<name> or a local path. */
export function parseSource(value: string, token?: string): ModelSource {
  if (!value.startsWith(HF_PREFIX)) return localSource(value);
  const repo = value.slice(HF_PREFIX.length).replace(/\/+$/, "");
  if (!/^[A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*$/.test(repo)) throw new Error(`MODELS_SOURCE has an incorrect dataset name: ${value}`);
  return hfSource(repo, token);
}
