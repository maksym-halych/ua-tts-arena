import Link from "next/link";
import { requireAdmin } from "@/server/auth";

const PAGES = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/raters", label: "Raters" },
  { href: "/admin/votes", label: "Votes" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div lang="en" className="flex flex-col gap-6">
      <nav aria-label="Admin pages" className="flex flex-wrap gap-1 border-b border-line pb-3">
        {PAGES.map((page) => (
          <Link key={page.href} href={page.href} className="btn bg-transparent text-ink-2">
            {page.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
