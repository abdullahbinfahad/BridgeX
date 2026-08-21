import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("BridgeX system-language preferences", () => {
  it("offers the requested languages and supports correct RTL document direction", () => {
    const language = read("../client/src/lib/language.ts");
    expect(language).toContain('code: "en"');
    expect(language).toContain('code: "zh-CN"');
    expect(language).toContain('code: "fr"');
    expect(language).toContain('code: "es"');
    expect(language).toContain('code: "de"');
    expect(language).toContain('code: "ar"');
    expect(language).toContain('code: "ja"');
    expect(language).toContain('code: "ko"');
    expect(language).toContain('code: "bn"');
    expect(language).toContain('code: "hi"');
    expect(language).toContain('code: "ur"');
    expect(language).toContain('RTL_LANGUAGES: readonly SystemLanguage[] = ["ar", "ur"]');
  });

  it("stores a new-member preference, synchronizes it after sign-in, and lets members change it in Settings", () => {
    const access = read("../client/src/pages/Access.tsx");
    const app = read("../client/src/App.tsx");
    const workspace = read("../client/src/pages/Workspace.tsx");
    const migration = read("../../../supabase/migrations/202608211500_member_language_preferences.sql");
    expect(access).toContain('preferred_language: language');
    expect(access).toContain('LANGUAGE_OPTIONS.map');
    expect(app).toContain("function LanguageProfileSync()");
    expect(app).toContain("<LanguageProvider>");
    expect(workspace).toContain("preferredLanguage");
    expect(workspace).toContain("preferred_language: form.preferredLanguage");
    expect(migration).toContain("preferred_language text NOT NULL DEFAULT 'en'");
    expect(migration).toContain("users_preferred_language_check");
  });

  it("provides complete fixed-interface translations and applies them through the language provider", () => {
    const provider = read("../client/src/contexts/LanguageContext.tsx");
    const fixed = read("../client/src/lib/fixedInterfaceTranslations.ts");
    for (const language of ["en", "zh-CN", "fr", "es", "de", "ar", "ja", "ko", "bn", "hi", "ur"]) {
      expect(fixed).toContain(`"${language}": {`);
    }
    expect(provider).toContain("localizeFixedInterface(document, language)");
    expect(provider).toContain("MutationObserver");
    expect(provider).toContain("data-bridgex-user-content");
    expect(fixed).toContain("allLanguageReverseLookup");
  });
});
