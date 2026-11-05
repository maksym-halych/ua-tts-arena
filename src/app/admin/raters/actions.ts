"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { forgetResults } from "@/server/results";
import { check, db } from "@/server/supabase";

const idSchema = z.uuid();
const reasonSchema = z.string().trim().min(1).max(500);

function done(): void {
  forgetResults();
  revalidatePath("/admin", "layout");
  revalidatePath("/leaderboard");
}

export async function excludeRater(form: FormData) {
  await requireAdmin();
  const id = idSchema.parse(form.get("id"));
  const reason = reasonSchema.parse(form.get("reason"));
  check(await db().from("raters").update({ excluded_at: new Date().toISOString(), excluded_reason: reason }).eq("id", id));
  done();
}

export async function restoreRater(form: FormData) {
  await requireAdmin();
  const id = idSchema.parse(form.get("id"));
  check(await db().from("raters").update({ excluded_at: null, excluded_reason: null }).eq("id", id));
  done();
}
