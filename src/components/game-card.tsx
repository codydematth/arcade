"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlmostTherePreview } from "@/components/game-previews/almost-there-preview";
import { SoonPreview } from "@/components/game-previews/soon-preview";
import { todaysBetrayalLine } from "@/lib/daily-betrayal";
import type { ArcadeGame } from "@/lib/games";
import { playTeaserBlip, unlockTeaserAudio } from "@/lib/teaser-audio";

type GameCardProps = {
  game: ArcadeGame;
  index: number;
  featured?: boolean;
};

function PreviewFor({ game }: { game: ArcadeGame }) {
  if (game.slug === "almost-there") {
    return <AlmostTherePreview className="block h-full w-full" />;
  }
  if (game.slug === "dont-blink") {
    return <SoonPreview kind="dont-blink" className="block h-full w-full" />;
  }
  if (game.slug === "one-more-second") {
    return (
      <SoonPreview kind="one-more-second" className="block h-full w-full" />
    );
  }
  return <div className="h-full w-full bg-bg" />;
}

function CardChrome({
  game,
  index,
  featured,
  preview,
}: {
  game: ArcadeGame;
  index: number;
  featured?: boolean;
  preview: ReactNode;
}) {
  return (
    <>
      <div
        className={
          featured
            ? "relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-[#070A12] sm:aspect-[2/1]"
            : "relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-[#070A12]"
        }
      >
        {preview}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070A12]/95 to-transparent"
        />
      </div>
      <div className={featured ? "p-5 sm:p-6" : "p-4 sm:p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              0{index + 1}
            </p>
            <h3
              className={
                featured
                  ? "mt-1.5 font-[family-name:var(--font-display)] text-2xl tracking-tight text-ink sm:text-3xl"
                  : "mt-1.5 font-[family-name:var(--font-display)] text-xl tracking-tight text-ink"
              }
            >
              {game.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted">{game.tagline}</p>
            {featured ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-accent">
                {todaysBetrayalLine()}
              </p>
            ) : null}
          </div>
          <span
            className={
              game.status === "live"
                ? "shrink-0 border border-fair/50 bg-fair/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-fair"
                : "shrink-0 border border-line px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted"
            }
          >
            {game.status === "live" ? "Live" : "Soon"}
          </span>
        </div>
        <p className="mt-3 text-xs text-accent-soft">{game.clipHook}</p>
      </div>
    </>
  );
}

export function GameCard({ game, index, featured = false }: GameCardProps) {
  const preview = <PreviewFor game={game} />;
  const shellClass = featured
    ? "group block overflow-hidden border border-line bg-bg-elevated transition hover:border-accent/60 hover:bg-[#1a2233]"
    : game.status === "live"
      ? "group block overflow-hidden border border-line bg-bg-elevated transition hover:border-accent/60 hover:bg-[#1a2233]"
      : "overflow-hidden border border-dashed border-line/70 bg-bg-elevated/40 opacity-90";

  async function armTeaser() {
    if (!featured) return;
    await unlockTeaserAudio();
    playTeaserBlip();
  }

  if (game.status === "live" && game.href) {
    return (
      <Link
        href={game.href}
        className={shellClass}
        onMouseEnter={() => {
          void armTeaser();
        }}
        onFocus={() => {
          void armTeaser();
        }}
        onTouchStart={() => {
          void armTeaser();
        }}
      >
        <CardChrome
          game={game}
          index={index}
          featured={featured}
          preview={preview}
        />
      </Link>
    );
  }

  return (
    <div className={shellClass}>
      <CardChrome
        game={game}
        index={index}
        featured={featured}
        preview={preview}
      />
    </div>
  );
}
