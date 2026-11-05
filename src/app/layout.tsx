import type { Metadata, Viewport } from "next";
import { Golos_Text, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { getI18n } from "@/server/i18n";
import "./globals.css";

const golos = Golos_Text({ subsets: ["latin", "cyrillic"], variable: "--font-golos", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.title, description: t.meta.description };
}

export const viewport: Viewport = { colorScheme: "light dark" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { lang } = await getI18n();
  return (
    <html lang={lang} className={`${golos.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
