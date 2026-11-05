import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/redirect";
import { env } from "@/server/env";
import { authClient } from "@/server/supabase";

/** Starts Google sign-in. The server keeps the PKCE code in a cookie, so the browser needs no Supabase key. */
export async function POST(request: Request) {
  const { APP_URL } = env();
  const form = await request.formData();
  const next = safeNextPath(form.get("next"));

  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return NextResponse.redirect(`${APP_URL}/sign-in?error=1`, 303);
  return NextResponse.redirect(data.url, 303);
}
