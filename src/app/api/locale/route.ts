import { localeFromCountryCode } from "@/lib/locale";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function countryFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("x-country-code"),
    headers.get("x-appengine-country"),
  ];
  for (const value of candidates) {
    if (value && value !== "XX" && /^[A-Za-z]{2}$/.test(value)) {
      return value.toUpperCase();
    }
  }
  return null;
}

async function fetchCountry(
  url: string,
  pick: (data: Record<string, unknown>) => string | null,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.error || data.reason === "RateLimited") return null;
    const code = pick(data)?.toUpperCase();
    return code && /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

async function countryFromPublicApis(): Promise<string | null> {
  const attempts = [
    fetchCountry("https://ipwho.is/", (d) =>
      d.success === false ? null : String(d.country_code ?? ""),
    ),
    fetchCountry("https://geojs.io/v1/ip/country.json", (d) =>
      String(d.country ?? d.country_code ?? ""),
    ),
    fetchCountry("https://ipapi.co/json/", (d) =>
      String(d.country_code ?? ""),
    ),
  ];

  for (const attempt of attempts) {
    const code = await attempt;
    if (code) return code;
  }
  return null;
}

export async function GET(request: Request) {
  const headerCountry = countryFromHeaders(request.headers);
  const code = headerCountry ?? (await countryFromPublicApis()) ?? "XX";
  const profile = localeFromCountryCode(code);

  return NextResponse.json(
    {
      ...profile,
      source: headerCountry ? "header" : code === "XX" ? "none" : "ip",
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
