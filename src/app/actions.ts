"use server";

import { cookies } from "next/headers";
import { isLang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/server/i18n";

const ONE_YEAR_S = 60 * 60 * 24 * 365;

export async function setLang(form: FormData) {
  const lang = form.get("lang");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: ONE_YEAR_S, sameSite: "lax" });
}
