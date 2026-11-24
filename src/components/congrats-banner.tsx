"use client";

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import {
  audienceRoastForResult,
  ctaForResult,
  eyebrowForResult,
  headlineForResult,
  moneyLabel,
  progressLabel,
  roastEmojiForResult,
  shareTextForResult,
  sublineForResult,
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
  const eyebrow = useMemo(() => eyebrowForResult(result), [result]);
  const emoji = useMemo(() => roastEmojiForResult(result), [result]);
  const headline = useMemo(() => headlineForResult(result), [result]);
  const subline = useMemo(() => sublineForResult(result), [result]);
  const audience = useMemo(() => audienceRoastForResult(result), [result]);
  const cta = useMemo(() => ctaForResult(result), [result]);
  const progress = useMemo(
    () => progressLabel(result.progress),
    [result.progress],
  );
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
      emoji,
      headline,
      subline,
      audience,
      progress,
      moneyLine,
      mascotLabel: mascot === "queen" ? "QUEEN" : "KING",
      drawMascot: (ctx, x, y, size) => {
        drawMascotPreview(ctx, mascot, x + size / 2, y + size / 2, size);
      },
    });
  }

  async function handleShare(e: MouseEvent | ReactKeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setShareNote("cooking 📸");
    try {
      const blob = await buildCard();
      const copied = await copyImageToClipboard(blob);
      downloadBlob(blob, `almost-there-${result.seed}.png`);
      setShareNote(
        copied
          ? "copied + downloaded 💀"
          : "downloaded 💀 (clipboard blocked)",
      );
      // Keep text handy for captions too
      try {
        if (!copied) {
          await navigator.clipboard.writeText(shareBody);
        }
      } catch {
        // ignore
      }
    } catch {
      setShareNote("share failed — try again");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadOnly(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const blob = await buildCard();
      downloadBlob(blob, `almost-there-${result.seed}.png`);
      setShareNote("downloaded 📥");
    } catch {
      setShareNote("download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center border-0 bg-[rgba(8,10,14,0.72)] p-4 text-center backdrop-blur-[2px] sm:p-6"
      onClick={onContinue}
      aria-label={cta}
    >
      <div className="animate-float-in w-full max-w-xl border border-line bg-[#121821]/95 px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-8 sm:py-9">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fair">
          {eyebrow}
        </p>

        <p className="mt-4 text-6xl leading-none sm:text-7xl" aria-hidden>
          {emoji}
        </p>

        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[0.95] text-ink sm:text-5xl">
          {headline}
        </h2>

        <p className="mt-4 text-base text-ink/85 sm:text-lg">{subline}</p>

        <p className="mt-3 text-sm font-medium text-accent-soft">{audience}</p>

        <p className="mt-3 text-lg font-extrabold text-fair">{moneyLine}</p>
        <p className="mt-1 text-xs text-muted">{progress}</p>

        <span className="mt-7 inline-flex bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white">
          {cta}
        </span>

        <div className="mt-5 flex flex-col items-center gap-2">
          <span
            role="link"
            tabIndex={0}
            className="pointer-events-auto text-xs uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline"
            onClick={(e) => {
              void handleShare(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleShare(e);
              }
            }}
          >
            expose this loss 📸{shareNote ? ` · ${shareNote}` : ""}
          </span>
          <span
            role="link"
            tabIndex={0}
            className="pointer-events-auto text-[10px] uppercase tracking-[0.16em] text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={(e) => {
              void handleDownloadOnly(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                e.preventDefault();
                void (async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    const blob = await buildCard();
                    downloadBlob(blob, `almost-there-${result.seed}.png`);
                    setShareNote("downloaded 📥");
                  } catch {
                    setShareNote("download failed");
                  } finally {
                    setBusy(false);
                  }
                })();
              }
            }}
          >
            download png
          </span>
        </div>
      </div>
    </button>
  );
}
