import Link from "next/link";
import type { ReactNode } from "react";
import { ARCADE_NAME, ARCADE_TAGLINE } from "@/lib/games";

type ArcadeShellProps = {
  children: ReactNode;
  compact?: boolean;
};

export function ArcadeShell({ children, compact = false }: ArcadeShellProps) {
  return (
    <div className="relative z-10 flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Link href="/" className="group min-w-0">
          <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-ink sm:text-2xl">
            {ARCADE_NAME}
            <span className="text-accent">.</span>
          </p>
          {!compact ? (
            <p className="truncate text-sm text-muted transition group-hover:text-ink/80">
              {ARCADE_TAGLINE}
            </p>
          ) : null}
        </Link>
        <a
          href="https://matthiasamire.com"
          className="shrink-0 text-xs uppercase tracking-[0.18em] text-muted transition hover:text-fair"
          target="_blank"
          rel="noopener noreferrer"
        >
          by Matthias
        </a>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
