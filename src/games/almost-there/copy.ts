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
import { formatCash, getLocale, zeroCash } from "@/lib/locale";

export function eyebrowForResult(result: RunResult): string {
  return nextEyebrow(result.won);
}

export function roastEmojiForResult(result: RunResult): string {
  void result;
  return nextEmoji();
}

export function headlineForResult(result: RunResult): string {
  return nextHeadline(result.won, result.failReason ?? "fell");
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
  return nextCta(result.won);
}

export function shareTextForResult(result: RunResult): string {
  return nextShare(result.won);
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

export function moneyLabel(result: RunResult): string {
  const pidgin = getLocale().dialect === "pidgin";
  if (result.won) {
    return pidgin
      ? `You keep ${formatCash(result.money)} · illegal o`
      : `Kept ${formatCash(result.money)} · illegal`;
  }
  if (result.moneyLost > 0) {
    return pidgin
      ? `You get ${formatCash(result.moneyLost)} → ${zeroCash()}`
      : `Had ${formatCash(result.moneyLost)} → ${zeroCash()}`;
  }
  return pidgin
    ? `${zeroCash()} · you break before start`
    : `${zeroCash()} · broke on arrival`;
}

export { formatCash };
