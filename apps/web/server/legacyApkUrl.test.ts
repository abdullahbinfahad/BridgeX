import { describe, expect, it } from "vitest";

describe("legacy APK release URL", () => {
  it("resolves as a public Expo artifact", async () => {
    const url = process.env.BRIDGEX_LEGACY_APK_URL;
    expect(url).toMatch(/^https:\/\/expo\.dev\/artifacts\/eas\/.+\.apk$/);
    const response = await fetch(url!, { method: "HEAD", redirect: "follow" });
    expect(response.ok).toBe(true);
    expect(response.url).toMatch(/\.apk(?:\?|$)/);
  }, 30_000);
});
