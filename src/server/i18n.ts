import "server-only";
import { cookies, headers } from "next/headers";
import { isLang, langFromHeader, STRINGS, type Lang, type Strings } from "@/lib/i18n";

export const LANG_COOKIE = "lang";

export async function getI18n(): Promise<{ lang: Lang; t: Strings }> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  const lang = isLang(saved) ? saved : langFromHeader((await headers()).get("accept-language"));
  return { lang, t: STRINGS[lang] };
}
