const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** The form that signs in with only an email address. It can't turn on with a hosted database. */
export function isLocalSignInAllowed(flag: string | undefined, supabaseUrl: string): boolean {
  return flag === "true" && LOOPBACK_HOSTS.has(new URL(supabaseUrl).hostname);
}
