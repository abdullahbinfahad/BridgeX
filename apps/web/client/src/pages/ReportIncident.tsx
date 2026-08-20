import PublicLayout from "@/components/bridgex/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { compressReportEvidenceImage, MAX_REPORT_EVIDENCE_BYTES } from "@/lib/fileUpload";
import { supabase } from "@/lib/supabase";
import { INCIDENT_CATEGORIES, canSubmitIncidentReport, type IncidentCategory } from "@shared/bridgeXControls";
import { AlertTriangle, ArrowLeft, FileUp, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function ReportIncident() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<IncidentCategory>("suspected_fraud");
  const [description, setDescription] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [subjectUserId, setSubjectUserId] = useState(() => new URLSearchParams(window.location.search).get("member") ?? "");
  const [evidence, setEvidence] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectEvidence = (files: FileList | null) => {
    setEvidence(Array.from(files ?? []).slice(0, 3));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !user) return setLocation("/access");
    if (!canSubmitIncidentReport(category, description, consent)) {
      setStatus("error");
      setMessage("Choose a category, describe the concern in at least 20 characters, and confirm the evidence consent.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const evidencePaths: string[] = [];
    for (const file of evidence) {
      const prepared = await compressReportEvidenceImage(file);
      if (prepared.size > MAX_REPORT_EVIDENCE_BYTES) {
        setStatus("error");
        setMessage(`${file.name} could not be compressed below 700 KB. Choose a clearer or smaller image.`);
        return;
      }

      const safeName = prepared.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/reports/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("request-media").upload(path, prepared, {
        contentType: prepared.type,
        upsert: false,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      evidencePaths.push(path);
    }

    const { error } = await supabase.from("incident_reports").insert({
      reporter_id: user.id,
      subject_user_id: subjectUserId.trim() || null,
      order_reference: orderReference.trim() || null,
      category,
      description: description.trim(),
      evidence_paths: evidencePaths,
      consent_confirmed: true,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Your safety report has been submitted for administrator review. Preserve any original evidence and contact local emergency services if there is immediate danger.");
  };

  return (
    <PublicLayout>
      <main className="px-5 py-10 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]">
            <ArrowLeft className="size-4" />
            Back to workspace
          </Link>

          <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Safety reporting</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Report a safety concern.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#637073]">Submit a factual report about suspected fraud, unsafe items, harassment, or identity misuse. Reports go to BridgeX administrators for review.</p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f8e8e5] text-[#9b4b3e]"><AlertTriangle className="size-6" /></span>
          </div>

          <form onSubmit={submit} className="mt-8 rounded-3xl border border-[#172126]/8 bg-white p-6 sm:p-8">
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2"><Label>Report category</Label><select value={category} onChange={(event) => setCategory(event.target.value as IncidentCategory)} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm">{INCIDENT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="grid gap-2"><Label>Related order reference (optional)</Label><Input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} placeholder="For example, BX-123456" className="h-11 rounded-xl" /></div>
              </div>
              <div className="grid gap-2"><Label>Reported member</Label><Input value={subjectUserId} onChange={(event) => setSubjectUserId(event.target.value)} placeholder="Member ID" className="h-11 rounded-xl" readOnly={Boolean(new URLSearchParams(window.location.search).get("member"))} /><p className="text-xs text-[#687579]">When opened from a public member profile, this account is attached to the report without revealing any private member data.</p></div>
              <div className="grid gap-2"><Label>What happened?</Label><Textarea required minLength={20} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Include dates, the agreed arrangement, the concern, and any relevant order details. Do not include passwords or unnecessary identity numbers." className="min-h-36 rounded-xl" /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#b8c8bf] bg-[#f4faf5] p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#dff5ea] text-[#176447]"><FileUp className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{evidence.length ? `${evidence.length} evidence file${evidence.length > 1 ? "s" : ""} selected` : "Add evidence images"}</span><span className="mt-0.5 block text-xs text-[#71807b]">Optional JPG, PNG, or WEBP. Up to 3 files; each image is reduced to a maximum 720 px and strongly compressed below 700 KB before private upload.</span></span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => selectEvidence(event.target.files)} /></label>
              <label className="flex gap-2 text-xs leading-5 text-[#5f6d6b]"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />I confirm that this report is truthful to the best of my knowledge and I consent to BridgeX storing the selected evidence for authorized safety review.</label>
              <Button disabled={status === "submitting"} className="h-12 rounded-xl bg-[#172126] font-bold"><ShieldCheck className="mr-2 size-4" />{status === "submitting" ? "Submitting report…" : "Submit safety report"}</Button>
              {message && <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${status === "sent" ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{message}</p>}
            </div>
          </form>
        </div>
      </main>
    </PublicLayout>
  );
}
