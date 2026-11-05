"use client";

import { STRINGS } from "@/lib/i18n";

// This page can't read the language cookie on the server, so it shows both languages.
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-lg font-semibold">{STRINGS.uk.errors.title}</p>
      <p className="text-ink-2">{STRINGS.en.errors.title}</p>
      <button onClick={reset} className="btn">
        {STRINGS.uk.arena.retry} / {STRINGS.en.arena.retry}
      </button>
    </div>
  );
}
