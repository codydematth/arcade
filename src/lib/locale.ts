export type Dialect = "en" | "pidgin";
export type CurrencyCode = "USD" | "NGN";

export type LocaleProfile = {
  countryCode: string;
  dialect: Dialect;
  currency: CurrencyCode;
};

/** Internal game cash → Naira display punch (not a live FX rate). */
const NAIRA_DISPLAY_MULT = 1500;

const STORAGE_KEY = "almost-fair-locale-v2";

const DEFAULT_LOCALE: LocaleProfile = {
  countryCode: "XX",
  dialect: "en",
  currency: "USD",
};

type LocaleGlobal = typeof globalThis & {
  __almostFairLocale?: LocaleProfile;
  __almostFairLocaleBooted?: boolean;
};

function store(): LocaleGlobal {
  return globalThis as LocaleGlobal;
}

/**
 * Locale lives on globalThis so every client chunk shares one profile.
 * Separate module copies of this file otherwise keep their own `let current`
 * and LocaleBoot can set NG while the canvas still reads USD.
 */
function readCurrent(): LocaleProfile {
  ensureClientBootstrap();
  return store().__almostFairLocale ?? DEFAULT_LOCALE;
}

function normalize(profile: LocaleProfile): LocaleProfile {
  const countryCode = (profile.countryCode || "XX").toUpperCase();
  // Pidgin and NG always mean Naira — never let a stale USD profile stick.
  if (countryCode === "NG" || profile.dialect === "pidgin") {
    return { countryCode: "NG", dialect: "pidgin", currency: "NGN" };
  }
  return {
    countryCode,
    dialect: profile.dialect,
    currency: profile.currency,
  };
}

function writeCurrent(profile: LocaleProfile) {
  store().__almostFairLocale = normalize(profile);
}

export function getLocale(): LocaleProfile {
  return readCurrent();
}

export function setLocale(profile: LocaleProfile) {
  writeCurrent(profile);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(store().__almostFairLocale),
      );
    } catch {
      // ignore
    }
  }
}

export function localeFromCountryCode(countryCode: string): LocaleProfile {
  const code = countryCode.toUpperCase();
  if (code === "NG") {
    return { countryCode: "NG", dialect: "pidgin", currency: "NGN" };
  }
  return {
    countryCode: code || "XX",
    dialect: "en",
    currency: "USD",
  };
}

/** Silent Nigeria heuristic — no permission UI. */
export function localeFromTimezone(timeZone?: string): LocaleProfile | null {
  const tz =
    timeZone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "");
  if (tz.trim() === "Africa/Lagos") {
    return localeFromCountryCode("NG");
  }
  return null;
}

export function readStoredLocale(): LocaleProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEY) ??
      window.sessionStorage.getItem("almost-fair-locale-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocaleProfile>;
    if (!parsed.countryCode || !parsed.dialect || !parsed.currency) return null;
    // Ignore weak / failed lookups so TZ can still win next boot.
    if (parsed.countryCode === "XX") return null;
    return {
      countryCode: parsed.countryCode,
      dialect: parsed.dialect,
      currency: parsed.currency,
    };
  } catch {
    return null;
  }
}

function persistClient(profile: LocaleProfile) {
  writeCurrent(profile);
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(store().__almostFairLocale),
    );
  } catch {
    // ignore
  }
}

/** Sync client bootstrap — safe to call from HUD / roasts before LocaleBoot effects. */
export function ensureClientBootstrap() {
  const g = store();
  if (typeof window === "undefined") return;

  // Lagos TZ always wins, even after a stale USD session was cached.
  const byTz = localeFromTimezone();
  if (byTz) {
    persistClient(byTz);
    g.__almostFairLocaleBooted = true;
    return;
  }

  const lang =
    typeof navigator !== "undefined"
      ? (navigator.language || "").toLowerCase()
      : "";
  if (lang === "en-ng" || lang.endsWith("-ng")) {
    persistClient(localeFromCountryCode("NG"));
    g.__almostFairLocaleBooted = true;
    return;
  }

  if (g.__almostFairLocaleBooted) return;
  g.__almostFairLocaleBooted = true;

  const stored = readStoredLocale();
  if (stored) {
    persistClient(stored);
  }
}

function usesNaira(profile: LocaleProfile = readCurrent()): boolean {
  return (
    profile.currency === "NGN" ||
    profile.dialect === "pidgin" ||
    profile.countryCode === "NG"
  );
}

export function formatCash(amount: number): string {
  const current = readCurrent();
  const base = Math.max(0, Math.floor(amount));
  if (usesNaira(current)) {
    const naira = base * NAIRA_DISPLAY_MULT;
    // Explicit code point — some canvas font stacks mishandle a literal ₦.
    return `\u20A6${naira.toLocaleString("en-NG")}`;
  }
  return `$${base.toLocaleString("en-US")}`;
}

export function zeroCash(): string {
  return usesNaira() ? "\u20A60" : "$0";
}
