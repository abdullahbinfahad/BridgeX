import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), "..", "..", path), "utf8");

describe("BridgeX marketplace cache and public-review regression coverage", () => {
  it("retains a cache-first native feed and quietly refreshes it from public post events", () => {
    const api = read("apps/mobile/src/lib/api.ts");
    const screen = read("apps/mobile/src/screens/MarketplaceScreen.tsx");
    const migration = read("supabase/migrations/202608220815_marketplace_realtime.sql");
    expect(api).toContain("loadCachedMarketplace");
    expect(screen).toContain("loadCachedMarketplace(tab)");
    expect(screen).toContain('tab === "requests" ? "send_requests" : "carry_listings"');
    expect(screen).toContain("native-marketplace-${table}");
    expect(screen).toContain("load(false, true)");
    expect(screen).toContain('accessibilityLabel="Choose product categories"');
    expect(migration).toContain("ADD TABLE public.send_requests");
    expect(migration).toContain("ADD TABLE public.carry_listings");
  });

  it("keeps web marketplace cards in session cache and refreshes public post changes without clearing the feed", () => {
    const marketplace = read("apps/web/client/src/pages/Marketplace.tsx");
    expect(marketplace).toContain("bridgex-marketplace:");
    expect(marketplace).toContain("readMarketCache");
    expect(marketplace).toContain("writeMarketCache");
    expect(marketplace).toContain("marketplace-${table}");
    expect(marketplace).toContain('table = view === "requests" ? "send_requests" : "carry_listings"');
  });

  it("renders permitted completed-order review comments in the native sender and traveler public profile", () => {
    const profile = read("apps/mobile/src/screens/MemberProfileScreen.tsx");
    const api = read("apps/mobile/src/lib/api.ts");
    expect(api).toContain("loadNativeMemberReviews");
    expect(profile).toContain("Completed-service reviews");
    expect(profile).toContain("review.comment");
  });
});
