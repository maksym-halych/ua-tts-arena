import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { skipRound } from "@/server/rounds";

const idSchema = z.uuid();

/** Replaces the round with another one and records no vote. The response never contains a model name. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });

  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const result = await skipRound(user, id.data);
  if (!result) return NextResponse.json({ error: "round_not_found" }, { status: 404 });
  if (result.status !== "ready") return NextResponse.json({ status: result.status });
  return NextResponse.json({ status: "ready", round: { id: result.round.id, text: result.text } });
}
