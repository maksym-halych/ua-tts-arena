import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/redirect";
import { env } from "@/server/env";
import { authClient } from "@/server/supabase";

export async function GET(request: Request) {
  const { APP_URL } = env();
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  if (code) {
    const supabase = await authClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${APP_URL}${safeNextPath(params.get("next"))}`);
  }
  return NextResponse.redirect(`${APP_URL}/sign-in?error=1`);
}
