"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isModelName } from "@/lib/names";
import { requireAdmin } from "@/server/auth";
import { forgetResults } from "@/server/results";
import { check as checkWrite, db } from "@/server/supabase";
import { checkModelFolder } from "./check";

const nameSchema = z.string().refine(isModelName);

function done(): void {
  forgetResults();
  revalidatePath("/admin", "layout");
  revalidatePath("/leaderboard");
}

export async function addModel(form: FormData) {
  await requireAdmin();
  const name = nameSchema.parse(form.get("name"));
  // The page showed this check earlier, but the folder can change after that.
  const check = await checkModelFolder(name);
  if (check.problems.length > 0) {
    redirect(`/admin/models?error=${encodeURIComponent(`${name}: ${check.problems.join(" ")}`)}`);
  }
  const { error } = await db().from("models").insert({ name, item_ids: check.itemIds });
  if (error && error.code !== "23505") throw new Error(error.message);
  done();
}

export async function pauseModel(form: FormData) {
  await requireAdmin();
  const name = nameSchema.parse(form.get("name"));
  checkWrite(await db().from("models").update({ paused_at: new Date().toISOString() }).eq("name", name));
  done();
}

export async function resumeModel(form: FormData) {
  await requireAdmin();
  const name = nameSchema.parse(form.get("name"));
  checkWrite(await db().from("models").update({ paused_at: null }).eq("name", name));
  done();
}
