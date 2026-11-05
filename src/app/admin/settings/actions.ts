"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { check, db } from "@/server/supabase";

const schema = z.object({
  setting: z.enum(["show_models_after_vote", "leaderboard_public"]),
  value: z.enum(["true", "false"]),
});

export async function changeSetting(form: FormData) {
  await requireAdmin();
  const { setting, value } = schema.parse({ setting: form.get("setting"), value: form.get("value") });
  const on = value === "true";
  check(
    await db()
      .from("settings")
      .update(setting === "leaderboard_public" ? { leaderboard_public: on } : { show_models_after_vote: on })
      .eq("id", true),
  );
  revalidatePath("/admin/settings");
  revalidatePath("/leaderboard");
}
