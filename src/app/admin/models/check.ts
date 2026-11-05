import "server-only";
import { checkFolder, type FolderCheck } from "@/lib/model-folder";
import { isModelName } from "@/lib/names";
import { listMp3Ids, loadDataset, readJsonFile } from "@/server/catalog";

export async function checkModelFolder(name: string): Promise<FolderCheck> {
  if (!isModelName(name)) return checkFolder(name, { manifest: undefined, metrics: undefined, mp3Ids: [] }, new Set());
  const [manifest, metrics, mp3Ids, dataset] = await Promise.all([
    readJsonFile(`${name}/manifest.json`),
    readJsonFile(`${name}/metrics.json`),
    listMp3Ids(name),
    loadDataset(),
  ]);
  return checkFolder(name, { manifest, metrics, mp3Ids }, new Set(dataset.keys()));
}
