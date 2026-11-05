import "server-only";
import { notFound, redirect } from "next/navigation";
import { env } from "./env";
import { authClient } from "./supabase";

export type CurrentUser = { id: string; email: string; isAdmin: boolean };

function adminEmails(): Set<string> {
  return new Set(
    env()
      .ADMIN_USERS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function currentUser(): Promise<CurrentUser | null> {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.email) return null;
  const email = user.email.toLowerCase();
  // An address that is not confirmed could belong to someone else.
  const isAdmin = Boolean(user.email_confirmed_at) && adminEmails().has(email);
  return { id: user.id, email, isAdmin };
}

/** Use at the start of every admin page and action. A layout alone doesn't protect actions. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (!user.isAdmin) notFound();
  return user;
}

/** Whether the auth server offers Google sign-in, so the page doesn't show a button that fails. */
export async function googleEnabled(): Promise<boolean> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = env();
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}
