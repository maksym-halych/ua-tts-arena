import { requireAdmin } from "@/server/auth";
import { loadSettings } from "@/server/settings";
import { changeSetting } from "./actions";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await loadSettings();
  const rows = [
    {
      setting: "show_models_after_vote",
      label: "Show the model names after each vote",
      detail: "Each vote records this value. Votes cast with the names hidden are closer to a blind test.",
      value: settings.showModelsAfterVote,
    },
    {
      setting: "leaderboard_public",
      label: "Make the leaderboard public",
      detail: "When this is off, only admins can see the leaderboard.",
      value: settings.leaderboardPublic,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <section className="card divide-y divide-line">
        {rows.map((row) => (
          <div key={row.setting} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="max-w-xl">
              <p className="font-medium">{row.label}</p>
              <p className="text-sm text-ink-2">{row.detail}</p>
            </div>
            <form action={changeSetting} className="flex items-center gap-3">
              <input type="hidden" name="setting" value={row.setting} />
              <input type="hidden" name="value" value={String(!row.value)} />
              <span className="text-sm font-medium">{row.value ? "On" : "Off"}</span>
              <button className="btn">{row.value ? "Turn off" : "Turn on"}</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
