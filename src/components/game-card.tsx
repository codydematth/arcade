import Link from "next/link";
import type { ReactNode } from "react";
import type { ArcadeGame } from "@/lib/games";
import { AlmostTherePreview } from "@/components/game-previews/almost-there-preview";
import { SoonPreview } from "@/components/game-previews/soon-preview";

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
            ? "relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-[#0b0f14] sm:aspect-[2/1]"
            : "relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-[#0b0f14]"
        }
      >
        {preview}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0f14]/90 to-transparent"
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
          </div>
          <span
            className={
              game.status === "live"
                ? "shrink-0 border border-fair/40 bg-fair/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-fair"
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
    ? "group block overflow-hidden border border-line bg-bg-elevated/50 transition hover:border-accent/45 hover:bg-bg-elevated"
    : game.status === "live"
      ? "group block overflow-hidden border border-line bg-bg-elevated/50 transition hover:border-accent/45 hover:bg-bg-elevated"
      : "overflow-hidden border border-dashed border-line/80 bg-bg-elevated/20 opacity-90";

  if (game.status === "live" && game.href) {
    return (
      <Link href={game.href} className={shellClass}>
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
