import Link from "next/link";
import { setLang } from "@/app/actions";
import { LANGS } from "@/lib/i18n";
import { currentUser } from "@/server/auth";
import { getI18n } from "@/server/i18n";

export async function Header() {
  const [{ lang, t }, user] = await Promise.all([getI18n(), currentUser()]);
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          UA TTS Arena
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ink-2">
          <Link href="/" className="hover:text-ink">
            {t.nav.vote}
          </Link>
          <Link href="/leaderboard" className="hover:text-ink">
            {t.nav.leaderboard}
          </Link>
          {user?.isAdmin && (
            <Link href="/admin" className="hover:text-ink">
              {t.nav.admin}
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <form action={setLang} aria-label={t.nav.language} className="flex gap-1">
            {LANGS.map((option) => (
              <button
                key={option}
                name="lang"
                value={option}
                aria-pressed={option === lang}
                className={`tag rounded-md px-1.5 py-1 uppercase ${option === lang ? "bg-fill !text-ink" : "hover:bg-fill"}`}
              >
                {option}
              </button>
            ))}
          </form>
          {user ? (
            <form action="/auth/sign-out" method="post" className="flex items-center gap-3">
              <span className="hidden max-w-48 truncate text-ink-3 sm:block">{user.email}</span>
              <button className="btn">{t.nav.signOut}</button>
            </form>
          ) : (
            <Link href="/sign-in" className="btn">
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
