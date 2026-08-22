import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("native usability release public surfaces", () => {
  it("labels browser web access separately from the independent native Android APK", () => {
    const layout = read("client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain('const WEB_APP_URL = "https://bridgex.abdullahbinfahad.info"');
    expect(layout).toContain("Web app — open in browser");
    expect(layout).toContain("Android app — independent native");
    expect(layout).toContain("data-bridgex-android-download");
  });

  it("uses mobile-first contact spacing and comfortable touch targets", () => {
    const contact = read("client/src/pages/ContactPage.tsx");
    expect(contact).toContain('className="px-4 py-6 sm:px-6 sm:py-10');
    expect(contact).toContain('className="h-12 rounded-xl text-base"');
    expect(contact).toContain("Stay safe on BridgeX.");
  });
});
