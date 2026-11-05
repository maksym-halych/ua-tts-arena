import Link from "next/link";
import { getI18n } from "@/server/i18n";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-lg font-semibold">{t.errors.notFound}</p>
      <Link href="/" className="btn">
        {t.errors.home}
      </Link>
    </div>
  );
}
