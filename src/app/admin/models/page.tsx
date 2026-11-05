import { formatDate } from "@/lib/format";
import { isModelName } from "@/lib/names";
import { requireAdmin } from "@/server/auth";
import { modelSource } from "@/server/catalog";
import { db, must } from "@/server/supabase";
import { addModel, pauseModel, resumeModel } from "./actions";
import { checkModelFolder } from "./check";

async function unaddedFolders(registered: ReadonlySet<string>) {
  const folders = await modelSource().listFolders();
  const names = folders.filter((name) => isModelName(name) && !registered.has(name)).sort();
  return Promise.all(names.map(async (name) => ({ name, check: await checkModelFolder(name) })));
}

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const models = must(await db().from("models").select("*").order("added_at"));

  let folders: Awaited<ReturnType<typeof unaddedFolders>> = [];
  let sourceError: string | null = null;
  try {
    folders = await unaddedFolders(new Set(models.map((model) => model.name)));
  } catch (cause) {
    sourceError = cause instanceof Error ? cause.message : String(cause);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <section className="card overflow-x-auto">
        <h2 className="p-5 pb-1 font-semibold">Registered models</h2>
        {models.length === 0 ? (
          <p className="p-5 pt-2 text-sm text-ink-2">No model is registered. Add a folder below.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">Items</th>
                <th scope="col">Added</th>
                <th scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.name}>
                  <td className="font-medium">{model.name}</td>
                  <td>{model.paused_at ? "Paused" : "Active"}</td>
                  <td className="num">{model.item_ids.length}</td>
                  <td>{formatDate(model.added_at)}</td>
                  <td className="num">
                    <form action={model.paused_at ? resumeModel : pauseModel}>
                      <input type="hidden" name="name" value={model.name} />
                      <button className="btn">{model.paused_at ? "Resume" : "Pause"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="p-5 pb-1 font-semibold">Folders not added yet</h2>
        {sourceError ? (
          <p role="alert" className="p-5 pt-2 text-sm text-danger">
            The app cannot read MODELS_SOURCE: {sourceError}
          </p>
        ) : folders.length === 0 ? (
          <p className="p-5 pt-2 text-sm text-ink-2">MODELS_SOURCE has no other folders.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Folder</th>
                <th scope="col" className="num">MP3 files</th>
                <th scope="col">Check</th>
                <th scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {folders.map(({ name, check }) => (
                <tr key={name}>
                  <td className="font-medium">{name}</td>
                  <td className="num">{check.itemIds.length}</td>
                  <td>
                    {check.problems.length === 0 && check.notes.length === 0 && "Complete"}
                    {check.problems.map((problem) => (
                      <p key={problem} className="text-danger">
                        {problem}
                      </p>
                    ))}
                    {check.notes.map((note) => (
                      <p key={note} className="text-ink-2">
                        {note}
                      </p>
                    ))}
                  </td>
                  <td className="num">
                    <form action={addModel}>
                      <input type="hidden" name="name" value={name} />
                      <button className="btn" disabled={check.problems.length > 0}>
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
