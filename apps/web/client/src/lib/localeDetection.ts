import { isSystemLanguage, SystemLanguage } from "@/lib/language";

const LANGUAGE_BY_PRIMARY_TAG: Record<string, SystemLanguage> = {
  en: "en",
  zh: "zh-CN",
  fr: "fr",
  es: "es",
  de: "de",
  ar: "ar",
  ja: "ja",
  ko: "ko",
  bn: "bn",
  hi: "hi",
  ur: "ur",
};

const TIMEZONE_LANGUAGE: Array<[RegExp, SystemLanguage]> = [
  [/^Asia\/(Shanghai|Chongqing|Beijing|Harbin|Urumqi|Hong_Kong|Macau)/i, "zh-CN"],
  [/^(Europe\/Madrid|Atlantic\/Canary|America\/(Mexico_City|Bogota|Lima|Santiago|Buenos_Aires|Argentina\/))$/i, "es"],
  [/^Europe\/(Paris|Brussels|Luxembourg|Monaco)/i, "fr"],
  [/^Europe\/(Berlin|Vienna|Zurich)/i, "de"],
  [/^Asia\/(Tokyo)/i, "ja"],
  [/^Asia\/(Seoul)/i, "ko"],
  [/^Asia\/(Dhaka|Chittagong)/i, "bn"],
  [/^Asia\/(Kolkata|Calcutta)/i, "hi"],
  [/^Asia\/(Karachi|Islamabad)/i, "ur"],
  [/^Africa\/(Cairo|Tripoli|Tunis|Algiers|Casablanca)/i, "ar"],
];

const COUNTRY_LANGUAGE: Record<string, SystemLanguage> = {
  CN: "zh-CN", HK: "zh-CN", MO: "zh-CN", TW: "zh-CN",
  ES: "es", MX: "es", AR: "es", CL: "es", CO: "es", PE: "es",
  FR: "fr", BE: "fr", LU: "fr", MC: "fr",
  DE: "de", AT: "de", CH: "de",
  SA: "ar", AE: "ar", EG: "ar", MA: "ar", DZ: "ar", TN: "ar",
  JP: "ja", KR: "ko", BD: "bn", IN: "hi", PK: "ur",
};

export function languageFromCountry(country: string | undefined): SystemLanguage | null {
  const candidate = COUNTRY_LANGUAGE[(country || "").trim().toUpperCase()];
  return candidate && isSystemLanguage(candidate) ? candidate : null;
}

function languageFromLocale(locale: string | undefined): SystemLanguage | null {
  if (!locale) return null;
  const primary = locale.trim().toLowerCase().split(/[-_]/)[0];
  const candidate = LANGUAGE_BY_PRIMARY_TAG[primary];
  return candidate && isSystemLanguage(candidate) ? candidate : null;
}

/**
 * Best-effort automatic choice for a first visit. Browsers do not expose a
 * visitor's precise country to client JavaScript, so we use the browser's
 * preferred locale first and timezone only as a conservative fallback.
 */
export function detectInitialLanguage(): SystemLanguage {
  if (typeof window === "undefined") return "en";

  const browserLocales = [
    ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
    window.navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ];
  const specificLocales = browserLocales.filter(locale => Boolean(locale && /[-_]/.test(locale)));
  for (const locale of specificLocales) {
    const language = languageFromLocale(locale);
    if (language && language !== "en") return language;
  }

  // A browser may report only en-US even when the visitor is abroad. In that
  // case timezone is a better regional signal than silently forcing English.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  for (const [pattern, language] of TIMEZONE_LANGUAGE) {
    if (pattern.test(timezone)) return language;
  }

  for (const locale of browserLocales) {
    const language = languageFromLocale(locale);
    if (language) return language;
  }
  return "en";
}
