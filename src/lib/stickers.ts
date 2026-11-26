import {
  getCareer,
  isHonestModeActive,
  WINS_FOR_HONEST_MODE,
} from "@/lib/career";
import { getLocale } from "@/lib/locale";
import type { RunResult } from "@/games/almost-there/types";

export type RoastSticker = {
  label: string;
  tone: "accent" | "fair" | "ink";
  rotate: number;
};

const LOSS_STICKERS_EN = [
  "ALMOST",
  "FAIR™",
  "CLIP THIS",
  "NEAR MISS",
  "TRUST ISSUE",
  "SKILL TAX",
] as const;

const LOSS_STICKERS_PIDGIN = [
  "ALMOST",
  "FAIR™",
  "CLIP AM",
  "NA WA",
  "E PAIN",
  "NO REACH",
] as const;

const WIN_STICKERS_EN = ["ILLEGAL W", "PATCH THIS", "WHO LET YOU"] as const;
const WIN_STICKERS_PIDGIN = ["ILLEGAL W", "NA SCAM", "WHO SEND YOU"] as const;

function pickStable<T>(items: readonly T[], seed: number, salt: number): T {
  const index = Math.abs((seed ^ salt) % items.length);
  return items[index]!;
}

/** One quiet stamp for the roast card — rotates by run seed, not every frame. */
export function stickerForResult(result: RunResult): RoastSticker {
  const pidgin = getLocale().dialect === "pidgin";
  const career = getCareer();
  const pct = Math.round(result.progress * 100);
  const seed = result.seed ^ Math.floor(result.durationMs);

  if (result.won) {
    if (isHonestModeActive()) {
      return {
        label:
          career.winStreak > 1
            ? `${career.winStreak} STREAK`
            : pidgin
              ? "CLEAN W"
              : "CLEAN W",
        tone: "fair",
        rotate: -8,
      };
    }
    if (
      career.honestUnlocked &&
      career.wins === WINS_FOR_HONEST_MODE
    ) {
      return {
        label: pidgin ? "HONEST OPEN" : "HONEST ON",
        tone: "fair",
        rotate: -8,
      };
    }
    const pool = pidgin ? WIN_STICKERS_PIDGIN : WIN_STICKERS_EN;
    return {
      label: pickStable(pool, seed, 11),
      tone: "fair",
      rotate: -8,
    };
  }

  if (career.lossStreak >= 3) {
    return {
      label: pidgin
        ? `${career.lossStreak}L STREAK`
        : `${career.lossStreak}L STREAK`,
      tone: "accent",
      rotate: 7,
    };
  }

  if (pct >= 90) {
    const near = pidgin
      ? ([`${pct}% PAIN`, "NA SMALL", "YOU SEE AM", "WHY NOW"] as const)
      : ([`${pct}% CLOSE`, "SO CLOSE", "ONE LEFT", "WHY THERE"] as const);
    return {
      label: pickStable(near, seed, 19),
      tone: "fair",
      rotate: -6,
    };
  }

  if (pct >= 70) {
    return {
      label: pidgin ? `${pct}% E PAIN` : `${pct}% HURTS`,
      tone: "fair",
      rotate: 5,
    };
  }

  const winsLeft = Math.max(0, WINS_FOR_HONEST_MODE - career.wins);
  if (winsLeft > 0 && (seed & 1) === 1) {
    return {
      label: pidgin ? `${winsLeft}W LEFT` : `${winsLeft}W LEFT`,
      tone: "accent",
      rotate: 5,
    };
  }

  const pool = pidgin ? LOSS_STICKERS_PIDGIN : LOSS_STICKERS_EN;
  return {
    label: pickStable(pool, seed, 29),
    tone: "accent",
    rotate: seed % 2 === 0 ? -7 : 6,
  };
}

export function stickerToneClass(tone: RoastSticker["tone"]): string {
  if (tone === "fair") return "border-fair/50 text-fair";
  if (tone === "ink") return "border-ink/30 text-ink";
  return "border-accent/45 text-accent";
}

export function stickerCanvasColor(tone: RoastSticker["tone"]): string {
  if (tone === "fair") return "#10B981";
  if (tone === "ink") return "#F8FAFC";
  return "#818CF8";
}
