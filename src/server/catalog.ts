import "server-only";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { metricsSchema, type Metrics } from "@/lib/model-folder";
import { parseSource, type ModelSource } from "@/lib/model-source";
import { env } from "./env";
import { memo } from "./memo";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

let source: ModelSource | undefined;

export function modelSource(): ModelSource {
  if (!source) {
    const { MODELS_SOURCE, HF_TOKEN } = env();
    source = parseSource(MODELS_SOURCE, HF_TOKEN);
  }
  return source;
}

const datasetLine = z.object({ id: z.string(), text: z.string() });

/** The dataset as a map from item id to text. DATASET_SOURCE is a URL or a local path. */
export function loadDataset(): Promise<Map<string, string>> {
  return memo("dataset", FIVE_MINUTES_MS, async () => {
    const { DATASET_SOURCE } = env();
    let content: string;
    if (/^https?:\/\//.test(DATASET_SOURCE)) {
      const response = await fetch(DATASET_SOURCE, { cache: "no-store" });
      if (!response.ok) throw new Error(`Dataset request returned ${response.status}: ${DATASET_SOURCE}`);
      content = await response.text();
    } else {
      content = await readFile(DATASET_SOURCE, "utf8");
    }
    const items = new Map<string, string>();
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      const item = datasetLine.parse(JSON.parse(line));
      items.set(item.id, item.text);
    }
    return items;
  });
}

export async function readJsonFile(path: string): Promise<unknown> {
  const bytes = await modelSource().readFile(path);
  if (!bytes) return undefined;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    // The folder check reports this as an incorrect format.
    return null;
  }
}

/** metrics.json of a model, or null if it is missing or incorrect. Metrics can change after voting starts. */
export function loadMetrics(model: string): Promise<Metrics | null> {
  return memo(`metrics:${model}`, FIVE_MINUTES_MS, async () => {
    const parsed = metricsSchema.safeParse(await readJsonFile(`${model}/metrics.json`));
    return parsed.success ? parsed.data : null;
  });
}

/** Ids of the MP3 copies in a model folder. */
export async function listMp3Ids(model: string): Promise<string[]> {
  const files = await modelSource().listFiles(`${model}/mp3`);
  return files.filter((file) => file.endsWith(".mp3")).map((file) => file.slice(0, -".mp3".length));
}
