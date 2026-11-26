import {
  nextAudience,
  nextCta,
  nextEmoji,
  nextEyebrow,
  nextHeadline,
  nextShare,
  nextSubline,
} from "@/games/almost-there/roasts";
import type { RunResult } from "@/games/almost-there/types";
import { baitLineForResult } from "@/lib/career";
import { formatCash, getLocale } from "@/lib/locale";

export function eyebrowForResult(result: RunResult): string {
  return nextEyebrow(result.won, result.progress);
}

export function roastEmojiForResult(result: RunResult): string {
  void result;
  return nextEmoji();
}

export function headlineForResult(result: RunResult): string {
  return nextHeadline(
    result.won,
    result.failReason ?? "fell",
    result.progress,
  );
}

export function sublineForResult(result: RunResult): string {
  return nextSubline(
    result.won,
    result.failReason ?? "fell",
    result.moneyLost,
  );
}

export function audienceRoastForResult(result: RunResult): string {
  return nextAudience(result.won);
}

export function ctaForResult(result: RunResult): string {
  return nextCta(result.won, result.progress);
}

export function shareTextForResult(result: RunResult): string {
  return nextShare(result.won, result.progress);
}

export function progressLabel(progress: number): string {
  const pct = Math.round(progress * 100);
  const pidgin = getLocale().dialect === "pidgin";
  if (pct >= 95) {
    return pidgin
      ? `${pct}% 😭 you almost collect am`
      : `${pct}% 😭 criminal near-miss`;
  }
  if (pct >= 80) {
    return pidgin ? `${pct}% 🔥 e pain you` : `${pct}% 🔥 so close it hurts`;
  }
  if (pct >= 50) {
    return pidgin ? `${pct}% 🤡 mid wahala` : `${pct}% 🤡 mid pain`;
  }
  return pidgin
    ? `${pct}% 🗑️ tutorial victim still`
    : `${pct}% 🗑️ tutorial victim`;
}

/** Card / share bait line — career hooks, not the money wipe. */
export function baitLabel(result: RunResult): string {
  return baitLineForResult({
    won: result.won,
    progress: result.progress,
    seed: result.seed ^ Math.floor(result.durationMs),
  });
}

/** @deprecated Prefer baitLabel */
export function moneyLabel(result: RunResult): string {
  return baitLabel(result);
}

export { formatCash };
