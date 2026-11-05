import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions } from "@/lib/session-cookie";

/**
 * Refreshes the session of the rater before each request. A page can read cookies
 * but can't set them, so the new tokens must be set here.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, sessionCookieOptions(options, process.env.APP_URL));
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
