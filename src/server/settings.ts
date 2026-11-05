import "server-only";
import { db, must } from "./supabase";

export type Settings = { showModelsAfterVote: boolean; leaderboardPublic: boolean };

export async function loadSettings(): Promise<Settings> {
  const row = must(await db().from("settings").select("*").eq("id", true).single());
  return { showModelsAfterVote: row.show_models_after_vote, leaderboardPublic: row.leaderboard_public };
}
