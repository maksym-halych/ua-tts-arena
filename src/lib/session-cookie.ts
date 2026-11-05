/**
 * Only the server reads the session cookies, because the browser has no Supabase
 * client. So scripts on the page never need them, and httpOnly can hide them.
 */
export function sessionCookieOptions<T extends object>(options: T, appUrl: string | undefined): T & { httpOnly: true; secure: boolean } {
  return { ...options, httpOnly: true, secure: Boolean(appUrl?.startsWith("https://")) };
}
