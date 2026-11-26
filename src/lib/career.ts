import { getLocale } from "@/lib/locale";

export const WINS_FOR_HONEST_MODE = 3;

const CAREER_KEY = "almost-fair-career-v1";
const TIP_KEY = "almost-fair-honest-tip-seen-v1";
const LEGACY_LOSSES_KEY = "almost-fair-losses-day-v1";

export type CareerStats = {
  wins: number;
  losses: number;
  lossesToday: number;
  lossDay: string;
  lossStreak: number;
  /** Current clear streak (Fair™ or Honest). */
  winStreak: number;
  bestWinStreak: number;
  bestProgress: number;
  honestUnlocked: boolean;
  /** Player left Honest Mode on after unlock (default true once unlocked). */
  honestEnabled: boolean;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function defaultCareer(): CareerStats {
  return {
    wins: 0,
    losses: 0,
    lossesToday: 0,
    lossDay: todayKey(),
    lossStreak: 0,
    winStreak: 0,
    bestWinStreak: 0,
    bestProgress: 0,
    honestUnlocked: false,
    honestEnabled: false,
  };
}

function migrateLossesToday(career: CareerStats): CareerStats {
  if (typeof window === "undefined") return career;
  if (career.lossDay === todayKey() && career.lossesToday > 0) return career;
  try {
    const raw = window.localStorage.getItem(LEGACY_LOSSES_KEY);
    if (!raw) {
      if (career.lossDay !== todayKey()) {
        return { ...career, lossDay: todayKey(), lossesToday: 0 };
      }
      return career;
    }
    const parsed = JSON.parse(raw) as { day?: string; losses?: number };
    if (parsed.day === todayKey()) {
      return {
        ...career,
        lossDay: todayKey(),
        lossesToday: Math.max(career.lossesToday, Number(parsed.losses) || 0),
      };
    }
  } catch {
    // ignore
  }
  if (career.lossDay !== todayKey()) {
    return { ...career, lossDay: todayKey(), lossesToday: 0 };
  }
  return career;
}

function readRaw(): CareerStats {
  if (typeof window === "undefined") return defaultCareer();
  try {
    const raw = window.localStorage.getItem(CAREER_KEY);
    if (!raw) return migrateLossesToday(defaultCareer());
    const parsed = JSON.parse(raw) as Partial<CareerStats>;
    const base: CareerStats = {
      ...defaultCareer(),
      wins: Math.max(0, Number(parsed.wins) || 0),
      losses: Math.max(0, Number(parsed.losses) || 0),
      lossesToday: Math.max(0, Number(parsed.lossesToday) || 0),
      lossDay: typeof parsed.lossDay === "string" ? parsed.lossDay : todayKey(),
      lossStreak: Math.max(0, Number(parsed.lossStreak) || 0),
      winStreak: Math.max(0, Number(parsed.winStreak) || 0),
      bestWinStreak: Math.max(0, Number(parsed.bestWinStreak) || 0),
      bestProgress: Math.min(1, Math.max(0, Number(parsed.bestProgress) || 0)),
      honestUnlocked: Boolean(parsed.honestUnlocked),
      honestEnabled: Boolean(parsed.honestEnabled),
    };
    if (base.wins >= WINS_FOR_HONEST_MODE) {
      base.honestUnlocked = true;
      if (parsed.honestEnabled === undefined) base.honestEnabled = true;
    }
    return migrateLossesToday(base);
  } catch {
    return migrateLossesToday(defaultCareer());
  }
}

function write(career: CareerStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAREER_KEY, JSON.stringify(career));
  } catch {
    // ignore
  }
}

export function getCareer(): CareerStats {
  return readRaw();
}

export function isHonestModeActive(): boolean {
  const c = getCareer();
  return c.honestUnlocked && c.honestEnabled;
}

export function setHonestModeEnabled(enabled: boolean): CareerStats {
  const c = getCareer();
  if (!c.honestUnlocked) return c;
  const next = { ...c, honestEnabled: enabled };
  write(next);
  return next;
}

export function recordRun(input: {
  won: boolean;
  progress: number;
}): CareerStats {
  const c = getCareer();
  const day = todayKey();
  const lossesToday = c.lossDay === day ? c.lossesToday : 0;
  const bestProgress = Math.max(c.bestProgress, Math.min(1, input.progress));

  let next: CareerStats;
  if (input.won) {
    const wins = c.wins + 1;
    const winStreak = c.winStreak + 1;
    const honestUnlocked = wins >= WINS_FOR_HONEST_MODE;
    next = {
      ...c,
      wins,
      lossStreak: 0,
      winStreak,
      bestWinStreak: Math.max(c.bestWinStreak, winStreak),
      bestProgress,
      lossDay: day,
      lossesToday,
      honestUnlocked,
      honestEnabled: honestUnlocked
        ? c.honestUnlocked
          ? c.honestEnabled
          : true
        : c.honestEnabled,
    };
  } else {
    next = {
      ...c,
      losses: c.losses + 1,
      lossesToday: lossesToday + 1,
      lossDay: day,
      lossStreak: c.lossStreak + 1,
      winStreak: 0,
      bestProgress,
    };
  }
  write(next);
  return next;
}

export function getLossesToday(): number {
  return getCareer().lossesToday;
}

/** @deprecated Prefer recordRun — kept for older call sites. */
export function recordLossToday(): number {
  return recordRun({ won: false, progress: 0 }).lossesToday;
}

export function hasSeenHonestTip(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TIP_KEY) === "1";
  } catch {
    return true;
  }
}

export function markHonestTipSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIP_KEY, "1");
  } catch {
    // ignore
  }
}

function pickStable(items: readonly string[], seed: number, salt: number): string {
  return items[Math.abs((seed ^ salt) % items.length)]!;
}

export function baitLineForResult(input: {
  won: boolean;
  progress: number;
  seed?: number;
}): string {
  const c = getCareer();
  const pidgin = getLocale().dialect === "pidgin";
  const honest = c.honestUnlocked && c.honestEnabled;
  const pct = Math.round(input.progress * 100);
  const best = Math.round(c.bestProgress * 100);
  const winsLeft = Math.max(0, WINS_FOR_HONEST_MODE - c.wins);
  const seed =
    input.seed ??
    (Math.floor(input.progress * 997) ^ (input.won ? 13 : 29) ^ c.losses);

  if (input.won) {
    if (honest) {
      return pickStable(
        pidgin
          ? [
              `${c.winStreak} clear streak · best ${c.bestWinStreak}`,
              `Honest W · streak ${c.winStreak} · no scam assist`,
              `I go lie for you? Clean clear · ${c.winStreak} deep`,
              `Skill only · streak ${c.winStreak}/${c.bestWinStreak} best`,
              `E choke · ${c.winStreak} honest clears · run am again`,
            ]
          : [
              `${c.winStreak} clear streak · best ${c.bestWinStreak}`,
              `Honest clear · streak ${c.winStreak}`,
              `Skill only · ${c.winStreak} deep · best ${c.bestWinStreak}`,
              `No scams · streak ${c.winStreak}. Keep stacking.`,
            ],
        seed,
        3,
      );
    }
    if (c.honestUnlocked) {
      return pickStable(
        pidgin
          ? [
              `Wins: ${c.wins} · flip Honest Mode for clean runs`,
              `Illegal W · streak ${c.winStreak} · or go Honest Mode`,
              `Fair™ still dey scam · Honest Mode dey wait for you`,
              `Clip mode W · streak ${c.winStreak} · try Honest next`,
            ]
          : [
              `Wins: ${c.wins} · switch to Honest for clean runs`,
              `Fair™ W · streak ${c.winStreak} · or flip Honest Mode`,
              `Clip fuel secured · Honest Mode is ready`,
            ],
        seed,
        5,
      );
    }
    return pickStable(
      pidgin
        ? [
            `Wins: ${c.wins}/${WINS_FOR_HONEST_MODE} · Honest Mode dey wait`,
            `You fit? ${c.wins}/${WINS_FOR_HONEST_MODE} W · Honest Mode close`,
            `Na wa · ${c.wins} W in · still dey unlock Honest`,
            `I go lie for you — ${c.wins}/${WINS_FOR_HONEST_MODE} to Honest Mode`,
          ]
        : [
            `Wins: ${c.wins}/${WINS_FOR_HONEST_MODE} · Honest Mode waiting`,
            `${c.wins}/${WINS_FOR_HONEST_MODE} · keep stacking Illegal Ws`,
            `Honest Mode unlock: ${c.wins}/${WINS_FOR_HONEST_MODE}`,
          ],
      seed,
      7,
    );
  }

  if (honest) {
    if (c.bestWinStreak > 0 && c.winStreak === 0) {
      return pickStable(
        pidgin
          ? [
              `Streak break · your best clear na ${c.bestWinStreak}`,
              `Na skill miss · best streak still ${c.bestWinStreak}`,
              `Platforms no lie · you miss · rebuild from 0`,
              `${pct}% · streak gone · chase ${c.bestWinStreak} again`,
            ]
          : [
              `Streak broken · best clear ${c.bestWinStreak}`,
              `Skill miss · rebuild toward ${c.bestWinStreak}`,
              `${pct}% · platforms told the truth · you missed`,
            ],
        seed,
        11,
      );
    }
    return pickStable(
      pidgin
        ? [
            `${pct}% · honest miss · gaps still dey`,
            `No scam this time · your jump no reach · ${pct}%`,
            `I go lie for you? Na timing · ${pct}%`,
            `Clean fail · ${pct}% · run am back`,
            best > pct
              ? `${pct}% · your best na ${best}% · chase am`
              : `${pct}% · keep stacking honest clears`,
          ]
        : [
            `${pct}% · honest miss · pure timing`,
            `No scams · you missed · ${pct}%`,
            `Skill check failed at ${pct}%`,
            best > pct
              ? `${pct}% · PB ${best}% · chase it`
              : `${pct}% · keep the honest streak alive`,
          ],
      seed,
      17,
    );
  }

  if (best > 0 && pct < best) {
    return pickStable(
      pidgin
        ? [
            `${pct}% · your best na ${best}% · chase am`,
            `${pct}%? I go lie for youuu — best still ${best}%`,
            `Na wa for you o · ${pct}% no reach your ${best}%`,
            `Shey you dey whine me? Best na ${best}% · this one ${pct}%`,
            `You fit chase ${best}%? This run na ${pct}% only`,
            `Omo ${pct}% soft · your ${best}% dey laugh for corner`,
            `Naso · ${pct}% · your peak ${best}% still dey wait`,
            `Abeg ${pct}% no be your ceiling · ${best}% dey remember you`,
          ]
        : [
            `${pct}% · personal best ${best}% · chase it`,
            `${pct}% under your ${best}% PB · rematch energy`,
            `You peaked at ${best}% · this was ${pct}%`,
            `${pct}% · your ghost run was ${best}%`,
            `Below PB (${best}%) · this one stopped at ${pct}%`,
          ],
      seed,
      41,
    );
  }

  if (pct >= 80) {
    return pickStable(
      pidgin
        ? [
            `${pct}% · almost collect am · ${winsLeft || "0"} W left`,
            `${pct}%? I go lie for you — you almost run am`,
            `Na wa o bro · ${pct}% pain · ${winsLeft || 0} W to Honest`,
            `E choke · ${pct}% near-miss · still ${winsLeft || 0} W left`,
            `You fit finish am next? ${pct}% · Honest Mode ${winsLeft || 0} W`,
            `As e dey sweet chat · e dey pain you · ${pct}%`,
          ]
        : [
            `${pct}% near-miss · ${winsLeft || 0} wins to Honest Mode`,
            `${pct}% so close · Honest Mode ${winsLeft || 0} wins away`,
            `Criminal near-miss at ${pct}% · keep stacking`,
            `${pct}% · the algorithm ate the landing`,
          ],
      seed,
      53,
    );
  }

  return pickStable(
    pidgin
      ? winsLeft > 0
        ? [
            `still ${winsLeft} W to Honest Mode`,
            `I go lie for you? ${winsLeft} W left to Honest`,
            `Na wa · ${winsLeft} more W before Honest Mode`,
            `You fit unlock am · ${winsLeft} W remaining`,
            `Abeg stack ${winsLeft} W · Honest Mode dey wait`,
          ]
        : [
            `Honest Mode dey wait — turn am on`,
            `I go lie for you — Honest Mode don unlock`,
            `Na you get Honest Mode · flip am on`,
            `Fair™ for clips · Honest for pride · pick one`,
          ]
      : winsLeft > 0
        ? [
            `${winsLeft} wins to Honest Mode`,
            `${winsLeft} more Illegal Ws unlock Honest Mode`,
            `Honest Mode: ${winsLeft} wins remaining`,
          ]
        : [
            `Honest Mode unlocked — flip it on`,
            `You earned Honest Mode · turn it on`,
            `Fair™ for clips · Honest for pride`,
          ],
    seed,
    67,
  );
}

export function honestProgressLabel(): string {
  const c = getCareer();
  const pidgin = getLocale().dialect === "pidgin";
  if (c.honestUnlocked && c.honestEnabled) {
    if (c.winStreak > 0) {
      return pidgin
        ? `Honest ON · ${c.winStreak} streak`
        : `Honest ON · ${c.winStreak} streak`;
    }
    return pidgin ? "Honest Mode ON" : "Honest Mode ON";
  }
  if (c.honestUnlocked) {
    return pidgin ? "Chaos Mode · clips" : "Chaos Mode · clips";
  }
  return pidgin
    ? `Honest Mode ${c.wins}/${WINS_FOR_HONEST_MODE}`
    : `Honest Mode ${c.wins}/${WINS_FOR_HONEST_MODE}`;
}
