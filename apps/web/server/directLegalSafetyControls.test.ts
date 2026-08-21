import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const migration = readFileSync(resolve(root, "supabase/migrations/202608211900_direct_legal_safety_controls.sql"), "utf8");
const requestComposer = readFileSync(resolve(root, "apps/web/client/src/pages/CreateFlow.tsx"), "utf8");
const interestComposer = readFileSync(resolve(root, "apps/web/client/src/pages/InterestPage.tsx"), "utf8");
const workspace = readFileSync(resolve(root, "apps/web/client/src/pages/Workspace.tsx"), "utf8");
const contact = readFileSync(resolve(root, "apps/web/client/src/pages/ContactPage.tsx"), "utf8");
const moderationMigration = readFileSync(resolve(root, "supabase/migrations/202608211930_reasoned_moderation_notices.sql"), "utf8");
const adminControl = readFileSync(resolve(root, "apps/web/client/src/pages/AdminControl.tsx"), "utf8");
const dashboardLayout = readFileSync(resolve(root, "apps/web/client/src/components/DashboardLayout.tsx"), "utf8");
const privacyBaseline = readFileSync(resolve(root, "docs/BridgeX_Privacy_Baseline.md"), "utf8");
const hardeningMigration = readFileSync(resolve(root, "supabase/migrations/202608211940_harden_legal_safety_function_access.sql"), "utf8");
const routeAwareMigration = readFileSync(resolve(root, "supabase/migrations/202608212000_route_aware_declarations.sql"), "utf8");
const marketingPages = readFileSync(resolve(root, "apps/web/client/src/pages/MarketingPages.tsx"), "utf8");
const deals = readFileSync(resolve(root, "apps/web/client/src/pages/Deals.tsx"), "utf8");

describe("direct legal-safety controls", () => {
  it("requires declared value, purpose, commercial-use status, and confirmation before new marketplace actions", () => {
    expect(migration).toContain("enforce_bridgex_item_declaration");
    expect(migration).toContain("declared_item_value");
    expect(migration).toContain("item_purpose");
    expect(migration).toContain("declared_commercial_use");
    expect(migration).toContain("declaration_confirmed_at");
    expect(requestComposer).toContain("Truthful item declaration");
    expect(interestComposer).toContain("Truthful item declaration");
  });

  it("creates a protected no-penalty traveler handoff-refusal path with administrator notification", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.bridgex_handoff_refusals");
    expect(migration).toContain("refuse_bridgex_handoff");
    expect(migration).toContain("fulfillment_status = 'disputed'");
    expect(migration).toContain("handoff_refused_admin");
    expect(workspace).toContain("Refuse unsafe handoff");
  });

  it("provides typed privacy and moderation-appeal intake through the protected support workflow", () => {
    expect(migration).toContain("enquiry_kind IN ('support', 'privacy_request', 'moderation_appeal')");
    expect(contact).toContain("privacy_request");
    expect(contact).toContain("moderation_appeal");
    expect(contact).toContain("Privacy request — access, correction, or deletion review");
  });

  it("requires member-facing reasons for restrictions and post pauses, then provides an appeal path", () => {
    expect(moderationMigration).toContain("moderate_bridgex_member");
    expect(moderationMigration).toContain("moderate_bridgex_marketplace_post");
    expect(moderationMigration).toContain("restriction_reason");
    expect(moderationMigration).toContain("moderation_reason");
    expect(moderationMigration).toContain("account_restricted");
    expect(moderationMigration).toContain("post_paused");
    expect(adminControl).toContain("Explain this account restriction clearly for the member");
    expect(adminControl).toContain("Explain why this");
    expect(dashboardLayout).toContain("Your BridgeX account is restricted");
    expect(dashboardLayout).toContain("Request a review");
  });

  it("documents internal privacy access, storage, retention, and request-handling baselines without promising certification", () => {
    expect(privacyBaseline).toContain("not legal advice or a statement of jurisdictional compliance");
    expect(privacyBaseline).toContain("Data inventory and intended storage");
    expect(privacyBaseline).toContain("Access-control baseline");
    expect(privacyBaseline).toContain("Retention and deletion baseline");
    expect(privacyBaseline).toContain("Privacy request");
    expect(privacyBaseline).toContain("Moderation appeal");
  });

  it("pins direct legal-safety functions to the public schema and blocks anonymous execution", () => {
    expect(hardeningMigration).toContain("ALTER FUNCTION public.enforce_bridgex_item_declaration() SET search_path = public");
    expect(hardeningMigration).toContain("REVOKE ALL ON FUNCTION public.refuse_bridgex_handoff(uuid, text, text) FROM anon");
    expect(hardeningMigration).toContain("REVOKE ALL ON FUNCTION public.moderate_bridgex_member(uuid, text, text) FROM anon");
    expect(hardeningMigration).toContain("REVOKE ALL ON FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) FROM anon");
    expect(hardeningMigration).toContain("GRANT EXECUTE ON FUNCTION public.moderate_bridgex_member(uuid, text, text) TO authenticated");
  });

  it("requires declaration currency only for international routes and stores a route-matched service scope", () => {
    expect(routeAwareMigration).toContain("declared_item_currency");
    expect(routeAwareMigration).toContain("service_scope IN ('domestic', 'international')");
    expect(routeAwareMigration).toContain("NEW.service_scope <> v_expected_scope");
    expect(routeAwareMigration).toContain("NEW.service_scope = 'international'");
    expect(requestComposer).toContain("Service route");
    expect(requestComposer).toContain("Declaration currency");
    expect(requestComposer).toContain("service_scope: form.serviceScope");
    expect(interestComposer).toContain("service_scope: serviceScope");
    expect(interestComposer).toContain("declared_item_currency: serviceScope === \"international\"");
  });

  it("uses location-neutral workflow wording and does not present an unfunded insurance promise", () => {
    expect(marketingPages).toContain("Post it. Match it. Carry it safely.");
    expect(marketingPages).toContain("does not currently offer an insurance policy or a guaranteed platform-funded reimbursement");
    expect(workspace).toContain('"Pickup arranged"');
    expect(workspace).not.toContain('"China pickup"');
    expect(deals).toContain('["china_pickup", "Pickup"]');
  });
});
