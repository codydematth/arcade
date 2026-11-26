import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell } from "@/components/arcade-shell";
import { ARCADE_URL } from "@/lib/games";

export const metadata: Metadata = {
  title: "Tip received",
  description: "Thanks for funding more unfairness. Go break another run.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${ARCADE_URL}/thanks`,
  },
};

export default function ThanksPage() {
  return (
    <ArcadeShell compact>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 pb-16 pt-10 sm:px-6">
        <section className="animate-float-in relative overflow-hidden border border-line bg-bg-elevated px-6 py-12 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent"
          />
          <p className="text-xs uppercase tracking-[0.28em] text-accent">
            Tip received
          </p>
          <h1 className="animate-stamp-in mt-4 font-[family-name:var(--font-display)] text-4xl leading-[0.95] tracking-tight text-ink sm:text-5xl">
            You just funded more{" "}
            <span className="text-accent">unfairness</span>.
          </h1>
          <p className="mt-5 text-base text-muted">
            Totally fair of you. Now go break another run.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/almost-there"
              className="animate-pulse-fair inline-flex h-12 items-center justify-center bg-accent px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-accent-soft"
            >
              Play Almost There
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center border border-line px-6 text-sm font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-accent"
            >
              Arcade
            </Link>
          </div>
        </section>
      </main>
    </ArcadeShell>
  );
}
