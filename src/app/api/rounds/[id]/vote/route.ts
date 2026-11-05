import { NextResponse } from "next/server";
import { z } from "zod";
import { listenedMs } from "@/lib/listening";
import { currentUser } from "@/server/auth";
import { forgetResults } from "@/server/results";
import { loadSettings } from "@/server/settings";
import { check, db, maybe } from "@/server/supabase";

const VOTES_PER_MINUTE = 15;
const UNIQUE_VIOLATION = "23505";

const idSchema = z.uuid();
const bodySchema = z.object({ chosen: z.enum(["a", "b"]) });

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return fail("sign_in_required", 401);

  const id = idSchema.safeParse((await context.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return fail("invalid_request", 400);

  const database = db();
  const round = maybe(await database.from("rounds").select("*").eq("id", id.data).eq("rater_id", user.id).maybeSingle());
  if (!round) return fail("round_not_found", 404);

  const now = Date.now();
  if (Date.parse(round.expires_at) <= now) {
    check(await database.from("rounds").delete().eq("id", round.id));
    return fail("round_expired", 410);
  }

  const listened = listenedMs(round.a_served_at, round.b_served_at, now);
  if (listened === null || listened < round.required_listen_ms) return fail("listen_more", 409);

  const lastMinute = new Date(now - 60_000).toISOString();
  const { count, error: countError } = await database
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("rater_id", user.id)
    .gt("created_at", lastMinute);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= VOTES_PER_MINUTE) return fail("too_many_votes", 429);

  const { chosen } = body.data;
  const settings = await loadSettings();
  const inserted = await database.from("votes").insert({
    rater_id: user.id,
    item_id: round.item_id,
    winner: chosen === "a" ? round.model_a : round.model_b,
    loser: chosen === "a" ? round.model_b : round.model_a,
    chosen_side: chosen,
    decision_ms: Math.round(listened),
    models_shown: settings.showModelsAfterVote,
  });
  // The unique index allows one vote for the combination, also with two tabs open.
  if (inserted.error && inserted.error.code !== UNIQUE_VIOLATION) throw new Error(inserted.error.message);
  check(await database.from("rounds").delete().eq("id", round.id));
  if (inserted.error) return fail("already_voted", 409);

  forgetResults();
  return NextResponse.json({
    models: settings.showModelsAfterVote ? { a: round.model_a, b: round.model_b } : null,
  });
}
