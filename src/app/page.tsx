import Link from "next/link";
import { Arena } from "@/components/arena";
import { currentUser } from "@/server/auth";
import { getI18n } from "@/server/i18n";

export default async function VotePage() {
  const [{ t }, user] = await Promise.all([getI18n(), currentUser()]);
  if (user) return <Arena t={t.arena} />;
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.landing.title}</h1>
      <p className="max-w-xl text-balance text-ink-2">{t.landing.body}</p>
      <Link href="/sign-in" className="btn btn-primary px-5 py-2.5">
        {t.landing.cta}
      </Link>
    </div>
  );
}
