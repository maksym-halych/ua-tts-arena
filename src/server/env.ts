import "server-only";
import { z } from "zod";
import { isLocalSignInAllowed } from "@/lib/local-sign-in";

const schema = z.object({
  APP_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  ADMIN_USERS: z.string().default(""),
  MODELS_SOURCE: z.string().min(1),
  HF_TOKEN: z.string().optional(),
  DATASET_SOURCE: z.string().min(1),
  LOCAL_SIGN_IN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let parsed: Env | undefined;

/** Read on first use, so that `next build` doesn't need the values. */
export function env(): Env {
  if (!parsed) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Incorrect or missing environment variables: ${fields}. See the README.`);
    }
    parsed = result.data;
  }
  return parsed;
}

export function localSignInEnabled(): boolean {
  const { LOCAL_SIGN_IN, SUPABASE_URL } = env();
  return isLocalSignInAllowed(LOCAL_SIGN_IN, SUPABASE_URL);
}
