import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { authClient } from "@/server/supabase";

export async function POST() {
  const supabase = await authClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${env().APP_URL}/`, 303);
}
