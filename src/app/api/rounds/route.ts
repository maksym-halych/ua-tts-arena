import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { openRound } from "@/server/rounds";

/** Returns the rater's open round or starts one. The response never contains a model name. */
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });

  const result = await openRound(user);
  if (result.status !== "ready") return NextResponse.json({ status: result.status });
  return NextResponse.json({ status: "ready", round: { id: result.round.id, text: result.text } });
}
