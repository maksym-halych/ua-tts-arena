import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "@/lib/session-cookie";
import type { Database } from "./database.types";
import { env } from "./env";

let client: SupabaseClient<Database> | undefined;

/** The database client. It holds the secret key and bypasses row level security, so it stays on the server. */
export function db(): SupabaseClient<Database> {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
    client = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** The auth client for one request. It keeps the session of the rater in cookies. */
export async function authClient() {
  const { APP_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = env();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) store.set(name, value, sessionCookieOptions(options, APP_URL));
        } catch {
          // A page can't set cookies. The proxy in src/proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Reads every row. The Supabase API returns at most 1000 rows for one request. */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}

type Result<T> = { data: T; error: { message: string } | null };

/** For a write: raises a database error so that it isn't lost. */
export function check(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message);
}

/** For a read that can find nothing. The type of the result includes null. */
export function maybe<T>(result: Result<T>): T {
  check(result);
  return result.data;
}

/** For a read that always returns data. */
export function must<T>(result: Result<T>): NonNullable<T> {
  const data = maybe(result);
  if (data === null || data === undefined) throw new Error("The database returned no data");
  return data;
}
