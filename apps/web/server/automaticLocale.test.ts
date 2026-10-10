import { describe, expect, it } from "vitest";
import { languageFromCountry } from "../client/src/lib/localeDetection";

describe("automatic visitor language detection", () => {
  it("maps supported country codes to the matching BridgeX language", () => {
    expect(languageFromCountry("CN")).toBe("zh-CN");
    expect(languageFromCountry("ES")).toBe("es");
    expect(languageFromCountry("FR")).toBe("fr");
    expect(languageFromCountry("BD")).toBe("bn");
    expect(languageFromCountry("JP")).toBe("ja");
  });

  it("returns null for unknown or missing country codes", () => {
    expect(languageFromCountry("US")).toBeNull();
    expect(languageFromCountry("")).toBeNull();
    expect(languageFromCountry(undefined)).toBeNull();
  });
});
