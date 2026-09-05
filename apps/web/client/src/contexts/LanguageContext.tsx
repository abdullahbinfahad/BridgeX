import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSystemLanguage, RTL_LANGUAGES, SystemLanguage, TranslationKey, translationFor } from "@/lib/language";
import { translateFixedInterfaceText } from "@/lib/fixedInterfaceTranslations";

type LanguageContextValue = {
  language: SystemLanguage;
  setLanguage: (language: SystemLanguage) => void;
  isRtl: boolean;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "bridgex-system-language";
const skippedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

const shouldSkipLocalization = (element: Element | null) => Boolean(
  !element ||
  skippedTags.has(element.tagName) ||
  element.closest("[data-bridgex-user-content], [data-bridgex-no-translate], [contenteditable='true']"),
);

const PRESERVED_SLOGAN_FRAGMENTS = new Set(["Post it.", "Match it.", "Carry it safely.", "Post it. Match it. Carry it safely."]);

const translateTextNode = (node: Text, language: SystemLanguage) => {
  const parent = node.parentElement;
  if (shouldSkipLocalization(parent)) return;
  const raw = node.nodeValue || "";
  const trimmed = raw.trim();
  if (!trimmed) return;
  if (language !== "zh-CN" && PRESERVED_SLOGAN_FRAGMENTS.has(trimmed)) return;
  const translated = translateFixedInterfaceText(language, trimmed);
  if (translated === trimmed) return;
  const leading = raw.match(/^\s*/)?.[0] || "";
  const trailing = raw.match(/\s*$/)?.[0] || "";
  node.nodeValue = `${leading}${translated}${trailing}`;
};

const translateElementAttributes = (element: Element, language: SystemLanguage) => {
  if (shouldSkipLocalization(element)) return;
  for (const attribute of ["placeholder", "aria-label", "title", "alt"]) {
    const value = element.getAttribute(attribute);
    if (!value) continue;
    const translated = translateFixedInterfaceText(language, value);
    if (translated !== value) element.setAttribute(attribute, translated);
  }
};

const localizeFixedInterface = (root: Node, language: SystemLanguage) => {
  const localizeElement = (element: Element) => {
    translateElementAttributes(element, language);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      translateTextNode(current as Text, language);
      current = walker.nextNode();
    }
  };
  if (root.nodeType === Node.TEXT_NODE) translateTextNode(root as Text, language);
  if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root as Element);
  if (root.nodeType === Node.DOCUMENT_NODE && document.body) localizeElement(document.body);
};

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
    localizeFixedInterface(document, language);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        Array.from(mutation.addedNodes).forEach(node => localizeFixedInterface(node, language));
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
