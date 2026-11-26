const STORAGE_KEY = "almost-fair-losses-day-v1";

type DayStreak = {
  day: string;
  losses: number;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function read(): DayStreak {
  if (typeof window === "undefined") return { day: todayKey(), losses: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { day: todayKey(), losses: 0 };
    const parsed = JSON.parse(raw) as Partial<DayStreak>;
    if (parsed.day !== todayKey()) return { day: todayKey(), losses: 0 };
    return { day: todayKey(), losses: Math.max(0, Number(parsed.losses) || 0) };
  } catch {
    return { day: todayKey(), losses: 0 };
  }
}

function write(streak: DayStreak) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(streak));
  } catch {
    // ignore
  }
}

export function getLossesToday(): number {
  return read().losses;
}

export function recordLossToday(): number {
  const next = { day: todayKey(), losses: read().losses + 1 };
  write(next);
  return next.losses;
}
