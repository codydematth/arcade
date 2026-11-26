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

/** ISO 3166-1 alpha-2 — Pidgin / West-African English roast tone for the continent. */
const AFRICA_COUNTRY_CODES = new Set([
  "AO",
  "BF",
  "BI",
  "BJ",
  "BW",
  "CD",
  "CF",
  "CG",
  "CI",
  "CM",
  "CV",
  "DJ",
  "DZ",
  "EG",
  "EH",
  "ER",
  "ET",
  "GA",
  "GH",
  "GM",
  "GN",
  "GQ",
  "GW",
  "KE",
  "KM",
  "LR",
  "LS",
  "LY",
  "MA",
  "MG",
  "ML",
  "MR",
  "MU",
  "MW",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RE",
  "RW",
  "SC",
  "SD",
  "SL",
  "SN",
  "SO",
  "SS",
  "ST",
  "SZ",
  "TD",
  "TG",
  "TN",
  "TZ",
  "UG",
  "YT",
  "ZA",
  "ZM",
  "ZW",
]);

/** Common IANA Africa zones → country (silent bootstrap when IP is flaky). */
const AFRICA_TZ_COUNTRY: Record<string, string> = {
  "Africa/Abidjan": "CI",
  "Africa/Accra": "GH",
  "Africa/Addis_Ababa": "ET",
  "Africa/Algiers": "DZ",
  "Africa/Bamako": "ML",
  "Africa/Bangui": "CF",
  "Africa/Banjul": "GM",
  "Africa/Bissau": "GW",
  "Africa/Blantyre": "MW",
  "Africa/Brazzaville": "CG",
  "Africa/Bujumbura": "BI",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Ceuta": "ES",
  "Africa/Conakry": "GN",
  "Africa/Dakar": "SN",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Djibouti": "DJ",
  "Africa/Douala": "CM",
  "Africa/El_Aaiun": "EH",
  "Africa/Freetown": "SL",
  "Africa/Gaborone": "BW",
  "Africa/Harare": "ZW",
  "Africa/Johannesburg": "ZA",
  "Africa/Juba": "SS",
  "Africa/Kampala": "UG",
  "Africa/Khartoum": "SD",
  "Africa/Kigali": "RW",
  "Africa/Kinshasa": "CD",
  "Africa/Lagos": "NG",
  "Africa/Libreville": "GA",
  "Africa/Lome": "TG",
  "Africa/Luanda": "AO",
  "Africa/Lubumbashi": "CD",
  "Africa/Lusaka": "ZM",
  "Africa/Malabo": "GQ",
  "Africa/Maputo": "MZ",
  "Africa/Maseru": "LS",
  "Africa/Mbabane": "SZ",
  "Africa/Mogadishu": "SO",
  "Africa/Monrovia": "LR",
  "Africa/Nairobi": "KE",
  "Africa/Ndjamena": "TD",
  "Africa/Niamey": "NE",
  "Africa/Nouakchott": "MR",
  "Africa/Ouagadougou": "BF",
  "Africa/Porto-Novo": "BJ",
  "Africa/Sao_Tome": "ST",
  "Africa/Tripoli": "LY",
  "Africa/Tunis": "TN",
  "Africa/Windhoek": "NA",
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

export function isAfricanCountry(countryCode: string): boolean {
  return AFRICA_COUNTRY_CODES.has(countryCode.toUpperCase());
}

function normalize(profile: LocaleProfile): LocaleProfile {
  const countryCode = (profile.countryCode || "XX").toUpperCase();

  // Nigeria keeps Naira + Pidgin.
  if (countryCode === "NG") {
    return { countryCode: "NG", dialect: "pidgin", currency: "NGN" };
  }

  // Rest of Africa: Pidgin copy, dollar display (no forced Naira).
  if (isAfricanCountry(countryCode)) {
    return {
      countryCode,
      dialect: "pidgin",
      currency: "USD",
    };
  }

  // Africa TZ with unknown ISO — keep Pidgin without inventing a country.
  if (profile.dialect === "pidgin" && countryCode === "XX") {
    return { countryCode: "XX", dialect: "pidgin", currency: "USD" };
  }

  return {
    countryCode,
    dialect: profile.dialect === "pidgin" ? "en" : profile.dialect,
    currency: profile.currency === "NGN" ? "USD" : profile.currency,
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
  if (isAfricanCountry(code)) {
    return { countryCode: code, dialect: "pidgin", currency: "USD" };
  }
  return {
    countryCode: code || "XX",
    dialect: "en",
    currency: "USD",
  };
}

/** Silent Africa heuristic — no permission UI. */
export function localeFromTimezone(timeZone?: string): LocaleProfile | null {
  const tz =
    timeZone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "");
  const trimmed = tz.trim();
  if (!trimmed.startsWith("Africa/")) return null;

  const mapped = AFRICA_TZ_COUNTRY[trimmed];
  if (mapped && isAfricanCountry(mapped)) {
    return localeFromCountryCode(mapped);
  }

  // Unknown Africa zone still gets Pidgin roast tone.
  return { countryCode: "XX", dialect: "pidgin", currency: "USD" };
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
    if (parsed.countryCode === "XX" && parsed.dialect !== "pidgin") return null;
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

  // Africa TZ always wins, even after a stale USD session was cached.
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

  // en-GH, en-KE, en-ZA, etc.
  const langCountry = lang.match(/^[a-z]{2}-([a-z]{2})$/)?.[1]?.toUpperCase();
  if (langCountry && isAfricanCountry(langCountry)) {
    persistClient(localeFromCountryCode(langCountry));
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
  return profile.currency === "NGN" || profile.countryCode === "NG";
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
