import { z } from "zod";
import { isModelName } from "./names";

// Only the fields the app reads. The ua-tts-eval package defines the full format.
export const manifestSchema = z.object({
  format_version: z.literal(1),
  items: z.record(z.string(), z.object({})),
});

export const metricsSchema = z.object({
  format_version: z.literal(1),
  items: z.record(
    z.string(),
    z.object({
      wer: z.number(),
      cer: z.number(),
      duration_s: z.number(),
      rtf: z.number(),
    }),
  ),
});

export type Metrics = z.infer<typeof metricsSchema>;

export type FolderFiles = {
  manifest: unknown;
  metrics: unknown;
  /** Ids of the files in mp3/. */
  mp3Ids: readonly string[];
};

export type FolderCheck = {
  /** Reasons the folder can't be added. */
  problems: string[];
  /** Things the admin should know, which don't stop the folder being added. */
  notes: string[];
  itemIds: string[];
};

export function checkFolder(name: string, files: FolderFiles, datasetIds: ReadonlySet<string>): FolderCheck {
  const problems: string[] = [];
  const notes: string[] = [];

  if (!isModelName(name)) problems.push("The folder name has characters that are not allowed.");

  const manifest = manifestSchema.safeParse(files.manifest);
  if (files.manifest === undefined) problems.push("manifest.json is missing.");
  else if (!manifest.success) problems.push("manifest.json has an incorrect format.");

  const metrics = metricsSchema.safeParse(files.metrics);
  if (files.metrics === undefined) problems.push("metrics.json is missing.");
  else if (!metrics.success) problems.push("metrics.json has an incorrect format.");

  if (files.mp3Ids.length === 0) problems.push("mp3/ is missing or empty. Run export_mp3 on the folder.");

  if (manifest.success) {
    const generated = new Set(Object.keys(manifest.data.items));
    const unknown = files.mp3Ids.filter((id) => !generated.has(id)).length;
    if (unknown > 0) problems.push(`${unknown} MP3 files are not in manifest.json. Run export_mp3 again.`);

    const withMp3 = new Set(files.mp3Ids);
    const noMp3 = [...generated].filter((id) => !withMp3.has(id)).length;
    if (noMp3 > 0) notes.push(`${noMp3} of ${generated.size} generated items have no MP3 copy. See bench.log.`);
  }

  if (metrics.success) {
    const measured = new Set(Object.keys(metrics.data.items));
    const noMetrics = files.mp3Ids.filter((id) => !measured.has(id)).length;
    if (noMetrics > 0) notes.push(`${noMetrics} MP3 files have no metrics.`);
  }

  const notInDataset = files.mp3Ids.filter((id) => !datasetIds.has(id)).length;
  if (notInDataset > 0) notes.push(`${notInDataset} MP3 files are not in the dataset. Raters will not get these items.`);

  return { problems, notes, itemIds: [...files.mp3Ids] };
}

export type MetricAverages = { wer: number; cer: number; rtf: number };

/** A plain average over the items in metrics.json. The package does not aggregate metrics. */
export function averageMetrics(metrics: Metrics): MetricAverages | null {
  const items = Object.values(metrics.items);
  if (items.length === 0) return null;
  return {
    wer: items.reduce((sum, item) => sum + item.wer, 0) / items.length,
    cer: items.reduce((sum, item) => sum + item.cer, 0) / items.length,
    rtf: items.reduce((sum, item) => sum + item.rtf, 0) / items.length,
  };
}
