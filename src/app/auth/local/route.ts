import { NextResponse } from "next/server";
import { z } from "zod";
import { safeNextPath } from "@/lib/redirect";
import { env, localSignInEnabled } from "@/server/env";
import { authClient, db } from "@/server/supabase";

const emailSchema = z.email();

/**
 * Signs in with an email address and no check, so that local work doesn't need
 * Google credentials. It works only with LOCAL_SIGN_IN=true and a database on
 * this machine. See localSignInEnabled.
 */
export async function POST(request: Request) {
  if (!localSignInEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { APP_URL } = env();
  const form = await request.formData();
  const email = emailSchema.safeParse(form.get("email"));
  const next = safeNextPath(form.get("next"));
  const failure = NextResponse.redirect(`${APP_URL}/sign-in?error=1`, 303);
  if (!email.success) return failure;

  const admin = db().auth.admin;
  const created = await admin.createUser({ email: email.data, email_confirm: true });
  if (created.error && created.error.code !== "email_exists") return failure;

  const link = await admin.generateLink({ type: "magiclink", email: email.data });
  if (link.error) return failure;

  const supabase = await authClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
  if (error) return failure;
  return NextResponse.redirect(`${APP_URL}${next}`, 303);
}
