import { ArcadeShell } from "@/components/arcade-shell";
import { FairnessMeter } from "@/components/fairness-meter";
import { GameCard } from "@/components/game-card";
import { todaysBetrayalLine } from "@/lib/daily-betrayal";
import { ARCADE_TAGLINE, GAMES } from "@/lib/games";
import Link from "next/link";

export default function HomePage() {
  const live = GAMES.filter((g) => g.status === "live");
  const soon = GAMES.filter((g) => g.status === "soon");
  const featured = GAMES.find((g) => g.slug === "almost-there") ?? live[0];
  const rest = GAMES.filter((g) => g.slug !== featured?.slug);

  return (
    <ArcadeShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <section className="animate-float-in relative overflow-hidden border border-line bg-bg-elevated px-5 py-10 sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-44 w-44 bg-accent/20 blur-3xl"
          />

          <p className="text-xs uppercase tracking-[0.28em] text-accent">
            Almost Fair arcade
          </p>
          <h1 className="animate-stamp-in mt-4 max-w-xl font-[family-name:var(--font-display)] text-5xl leading-[0.92] tracking-tight text-ink sm:text-7xl">
            Almost
            <span className="text-accent"> Fair</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            {ARCADE_TAGLINE} Tiny web games with near-misses, fake floors, and
            suspiciously loud congratulations.
          </p>

          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-accent-soft">
            {todaysBetrayalLine()}
          </p>

          <FairnessMeter className="mt-6" />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/almost-there"
              className="animate-pulse-fair inline-flex h-12 items-center justify-center bg-accent px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-accent-soft"
            >
              Play Almost There
            </Link>
            <a
              href="#games"
              className="inline-flex h-12 items-center justify-center border border-line px-6 text-sm font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-accent"
            >
              Browse arcade
            </a>
          </div>
        </section>

        <section id="games" className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-ink">
              Arcade
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              {live.length} live · {soon.length} cooking
            </p>
          </div>

          <div className="grid gap-4">
            {featured ? (
              <GameCard
                game={featured}
                index={GAMES.findIndex((g) => g.slug === featured.slug)}
                featured
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((game) => (
                <GameCard
                  key={game.slug}
                  game={game}
                  index={GAMES.findIndex((g) => g.slug === game.slug)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </ArcadeShell>
  );
}
