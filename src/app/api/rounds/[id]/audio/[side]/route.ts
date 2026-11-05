import { NextResponse } from "next/server";
import { z } from "zod";
import { isItemId, isModelName } from "@/lib/names";
import { currentUser } from "@/server/auth";
import { modelSource } from "@/server/catalog";
import { check, db, maybe } from "@/server/supabase";

const paramsSchema = z.object({ id: z.uuid(), side: z.enum(["a", "b"]) });

/** Sends one clip under a neutral URL. Only the rater of the round can get it. */
export async function GET(_request: Request, context: { params: Promise<{ id: string; side: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { id, side } = params.data;

  const round = maybe(await db().from("rounds").select("*").eq("id", id).eq("rater_id", user.id).maybeSingle());
  if (!round || Date.parse(round.expires_at) <= Date.now()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const model = side === "a" ? round.model_a : round.model_b;
  if (!isModelName(model) || !isItemId(round.item_id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const bytes = await modelSource().readFile(`${model}/mp3/${round.item_id}.mp3`);
  if (!bytes) {
    // The rater can never hear this clip, so the listening check could never pass. A new round replaces this one.
    check(await db().from("rounds").delete().eq("id", id));
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Only the first time counts, so a reload doesn't restart the listening check.
  const now = new Date().toISOString();
  const rounds = db().from("rounds");
  check(
    side === "a"
      ? await rounds.update({ a_served_at: now }).eq("id", id).is("a_served_at", null)
      : await rounds.update({ b_served_at: now }).eq("id", id).is("b_served_at", null),
  );

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
