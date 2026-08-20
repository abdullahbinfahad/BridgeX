import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("BridgeX safety-report evidence handling", () => {
  it("strongly compresses report evidence before upload", () => {
    const upload = read("../client/src/lib/fileUpload.ts");
    const report = read("../client/src/pages/ReportIncident.tsx");
    expect(upload).toContain("MAX_REPORT_EVIDENCE_BYTES = 700 * 1024");
    expect(upload).toContain("REPORT_EVIDENCE_MAX_DIMENSION = 720");
    expect(upload).toContain("compressReportEvidenceImage");
    expect(report).toContain("compressReportEvidenceImage(file)");
    expect(report).toContain("below 700 KB before private upload");
  });

  it("opens signed report evidence for administrators and uses the Storage API only on final close", () => {
    const admin = read("../client/src/pages/AdminControl.tsx");
    const migration = read("../../../supabase/migrations/202608211230_authorize_report_evidence_storage_delete.sql");
    expect(admin).toContain("viewReportEvidence");
    expect(admin).toContain('createSignedUrl(path, 600)');
    expect(admin).toContain('changes.status === "under_review"');
    expect(admin).toContain('storage.from("request-media").remove(paths)');
    expect(admin).toContain('evidence_paths: []');
    expect(admin).not.toContain('close_bridgex_incident_report');
    expect(migration).toContain("request_media_delete_admin_report_evidence");
    expect(migration).toContain("FOR DELETE TO authenticated");
    expect(migration).toContain("name LIKE '%/reports/%'");
  });
});
