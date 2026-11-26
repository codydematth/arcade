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
  moneyLabel,
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
import { getLocale } from "@/lib/locale";
import { getLossesToday } from "@/lib/streak";

type CongratsBannerProps = {
  result: RunResult;
  mascot: MascotId;
  gameCanvas: HTMLCanvasElement | null;
  onContinue: () => void;
};

export function CongratsBanner({
  result,
  mascot,
  gameCanvas,
  onContinue,
}: CongratsBannerProps) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const primedBlob = useRef<Blob | null>(null);
  const pidgin = getLocale().dialect === "pidgin";
  const lossesToday = getLossesToday();
  const exposeLabel = result.won
    ? "EXPOSE THIS ILLEGAL W"
    : pidgin
      ? "EXPOSE THIS LOSS ABEG"
      : "EXPOSE THIS LOSS";

  const eyebrow = useMemo(() => eyebrowForResult(result), [result]);
  const headline = useMemo(() => headlineForResult(result), [result]);
  const cta = useMemo(() => ctaForResult(result), [result]);
  const moneyLine = useMemo(() => moneyLabel(result), [result]);
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
      moneyLine,
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
          setCardReady(true);
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
    setCardReady(true);
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

  async function handleDownloadOnly(e: MouseEvent | ReactKeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const blob = await getCardBlob();
      downloadBlob(blob, `almost-there-${result.seed}.png`);
      setShareNote("saved");
    } catch {
      setShareNote("failed");
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
      <div className="animate-float-in w-full max-w-md border border-line bg-[#131926]/97 px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7 sm:py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>

        <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-[1.05] text-ink sm:text-4xl">
          {headline}
        </h2>

        <p className="mt-4 text-base font-extrabold text-fair sm:text-lg">
          {moneyLine}
        </p>

        {lossesToday > 0 && !result.won ? (
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted">
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
          <span
            role="link"
            tabIndex={0}
            className="pointer-events-auto text-[10px] uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={(e) => {
              void handleDownloadOnly(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleDownloadOnly(e);
            }}
          >
            {shareNote ?? (cardReady ? "or download png" : "priming…")}
          </span>
        </div>
      </div>
    </button>
  );
}
