import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSystemLanguage, RTL_LANGUAGES, SystemLanguage, TranslationKey, translationFor } from "@/lib/language";

type LanguageContextValue = {
  language: SystemLanguage;
  setLanguage: (language: SystemLanguage) => void;
  isRtl: boolean;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "bridgex-system-language";

const initialLanguage = (): SystemLanguage => {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isSystemLanguage(saved) ? saved : "en";
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<SystemLanguage>(initialLanguage);
  const setLanguage = useCallback((next: SystemLanguage) => updateLanguage(next), []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
    try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* Preference remains in memory when storage is unavailable. */ }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    isRtl: RTL_LANGUAGES.includes(language),
    t: (key: TranslationKey) => translationFor(language, key),
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
