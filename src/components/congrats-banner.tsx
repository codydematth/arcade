"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import {
  ctaForResult,
  eyebrowForResult,
  headlineForResult,
  shareTextForResult,
} from "@/games/almost-there/copy";
import {
  drawMascotPreview,
  type MascotId,
} from "@/games/almost-there/mascot";
import type { RunResult } from "@/games/almost-there/types";
import {
  copyImageToClipboard,
  downloadBlob,
  renderRoastCard,
} from "@/lib/capture";
import {
  getCareer,
  getLossesToday,
  WINS_FOR_HONEST_MODE,
} from "@/lib/career";
import { getLocale } from "@/lib/locale";
import { stickerForResult, stickerToneClass } from "@/lib/stickers";

type CongratsBannerProps = {
  result: RunResult;
  mascot: MascotId;
  gameCanvas: HTMLCanvasElement | null;
  onContinue: () => void;
  honestUnlocked?: boolean;
  honestActive?: boolean;
  onSwitchMode?: (honest: boolean) => void;
};

export function CongratsBanner({
  result,
  mascot,
  gameCanvas,
  onContinue,
  honestUnlocked = false,
  honestActive = false,
  onSwitchMode,
}: CongratsBannerProps) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const primedBlob = useRef<Blob | null>(null);
  const pidgin = getLocale().dialect === "pidgin";
  const lossesToday = getLossesToday();
  const career = getCareer();
  const justUnlockedHonest =
    result.won &&
    career.honestUnlocked &&
    career.wins === WINS_FOR_HONEST_MODE;
  const exposeLabel = result.won
    ? honestActive
      ? pidgin
        ? "EXPOSE THIS CLEAN W"
        : "EXPOSE THIS CLEAN W"
      : "EXPOSE THIS ILLEGAL W"
    : pidgin
      ? "EXPOSE THIS LOSS ABEG"
      : "EXPOSE THIS LOSS";

  const eyebrow = useMemo(() => eyebrowForResult(result), [result]);
  const headline = useMemo(() => headlineForResult(result), [result]);
  const cta = useMemo(() => ctaForResult(result), [result]);
  const sticker = useMemo(() => stickerForResult(result), [result]);
  const shareBody = useMemo(() => shareTextForResult(result), [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  async function buildCard(): Promise<Blob> {
    if (!gameCanvas) {
      throw new Error("Missing game canvas");
    }
    return renderRoastCard({
      gameCanvas,
      eyebrow,
      headline,
      sticker,
      mascotLabel: mascot === "queen" ? "QUEEN" : "KING",
      drawMascot: (ctx, x, y, size) => {
        drawMascotPreview(ctx, mascot, x + size / 2, y + size / 2, size);
      },
    });
  }

  useEffect(() => {
    let cancelled = false;
    primedBlob.current = null;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const blob = await buildCard();
          if (cancelled) return;
          primedBlob.current = blob;
        } catch {
          // share still builds on demand
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prime once per result
  }, [result.seed, result.won, result.durationMs, gameCanvas]);

  async function getCardBlob(): Promise<Blob> {
    if (primedBlob.current) return primedBlob.current;
    const blob = await buildCard();
    primedBlob.current = blob;
    return blob;
  }

  async function handleShare(e: MouseEvent | ReactKeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setShareNote(pidgin ? "e dey cook…" : "cooking…");
    try {
      const blob = await getCardBlob();
      const copied = await copyImageToClipboard(blob);
      downloadBlob(blob, `almost-there-${result.seed}.png`);
      setShareNote(copied ? "copied + saved" : "saved");
      try {
        if (!copied) {
          await navigator.clipboard.writeText(shareBody);
        }
      } catch {
        // ignore
      }
    } catch {
      setShareNote("failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center border-0 bg-[rgba(7,10,18,0.82)] p-4 text-center backdrop-blur-[2px] sm:p-6"
      onClick={onContinue}
      aria-label={cta}
    >
      <div className="animate-float-in relative w-full max-w-md overflow-hidden border border-line bg-[#131926]/97 px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7 sm:py-8">
        <span
          aria-hidden
          className={`pointer-events-none absolute -right-1 top-4 z-10 select-none border-2 border-dashed bg-[#0B0F19]/88 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:right-2 sm:top-5 sm:text-xs ${stickerToneClass(sticker.tone)}`}
          style={{ transform: `rotate(${sticker.rotate}deg)` }}
        >
          {sticker.label}
        </span>

        <p className="pr-20 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent sm:pr-24">
          {eyebrow}
        </p>

        <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-[1.05] text-ink sm:text-4xl">
          {headline}
        </h2>

        {justUnlockedHonest ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-accent">
            Honest Mode unlocked
          </p>
        ) : result.won && honestActive && career.winStreak > 0 ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted">
            {career.winStreak} clear streak
            {career.bestWinStreak > career.winStreak
              ? ` · best ${career.bestWinStreak}`
              : ""}
          </p>
        ) : lossesToday > 0 && !result.won ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted">
            {lossesToday} loss{lossesToday === 1 ? "" : "es"} today
          </p>
        ) : null}

        <span className="mt-7 inline-flex bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white">
          {cta}
        </span>

        <div className="mt-5 flex w-full flex-col items-center gap-2">
          <span
            role="link"
            tabIndex={0}
            className="pointer-events-auto inline-flex w-full items-center justify-center border border-ink/25 bg-ink px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-bg transition hover:border-accent hover:bg-accent hover:text-white"
            onClick={(e) => {
              void handleShare(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleShare(e);
            }}
          >
            {busy ? "…" : exposeLabel}
          </span>
          {honestUnlocked && onSwitchMode ? (
            <span
              role="link"
              tabIndex={0}
              className="pointer-events-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-muted underline-offset-2 transition hover:text-ink hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSwitchMode(!honestActive);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  e.preventDefault();
                  onSwitchMode(!honestActive);
                }
              }}
            >
              {honestActive
                ? pidgin
                  ? "Back to Chaos Mode"
                  : "Back to Chaos Mode"
                : pidgin
                  ? "Switch to Honest Mode"
                  : "Switch to Honest Mode"}
            </span>
          ) : null}
          {shareNote ? (
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
              {shareNote}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
