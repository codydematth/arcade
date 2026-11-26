"use client";

import { useEffect } from "react";
import {
  ensureClientBootstrap,
  localeFromCountryCode,
  localeFromTimezone,
  setLocale,
  type LocaleProfile,
} from "@/lib/locale";

function apply(profile: LocaleProfile) {
  setLocale(profile);
}

async function countryFromBrowserApis(): Promise<string | null> {
  const urls = [
    "https://ipwho.is/",
    "https://get.geojs.io/v1/ip/country.json",
  ] as const;

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown>;
      if (data.success === false || data.error) continue;
      const code = String(data.country_code ?? data.country ?? "")
        .toUpperCase()
        .slice(0, 2);
      if (/^[A-Z]{2}$/.test(code) && code !== "XX") return code;
    } catch {
      // try next provider
    }
  }
  return null;
}

/**
 * Silently resolves locale. No UI.
 * Any Africa/* timezone wins for Pidgin (IP APIs are flaky/rate-limited).
 */
export function LocaleBoot() {
  // Sync path runs before paint when this module evaluates / first getLocale.
  ensureClientBootstrap();

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      ensureClientBootstrap();

      // If Africa TZ already locked Pidgin, skip flaky IP overrides.
      if (localeFromTimezone()) return;

      try {
        const res = await fetch("/api/locale", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as Partial<LocaleProfile>;
          if (!cancelled && data.countryCode && data.countryCode !== "XX") {
            apply(
              data.dialect && data.currency
                ? {
                    countryCode: data.countryCode,
                    dialect: data.dialect,
                    currency: data.currency,
                  }
                : localeFromCountryCode(data.countryCode),
            );
            return;
          }
        }
      } catch {
        // continue
      }

      if (cancelled) return;

      const browserCountry = await countryFromBrowserApis();
      if (cancelled) return;
      if (browserCountry) {
        apply(localeFromCountryCode(browserCountry));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
