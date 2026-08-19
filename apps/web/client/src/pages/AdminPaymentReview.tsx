import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle2, ExternalLink, ImageIcon, Loader2, ReceiptText, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Member = { id: string; full_name: string | null; email: string | null; phone: string | null };
type PaymentProof = { id: string; reference: string; response_kind: "offer" | "interest"; response_id: string; request_id: string | null; listing_id: string | null; payer_id: string; owner_id: string; amount: number; currency: string; payment_method: "alipay" | "wechat_pay" | null; status: string; proof_path: string | null; payer_reference: string | null; payer_note: string | null; submitted_at: string | null; verified_by: string | null; verified_at: string | null; reviewer_note: string | null; created_at: string };

const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "BDT", maximumFractionDigits: 2 }).format(Number(amount || 0));
const statusLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
const memberLabel = (member: Member | null) => member?.full_name || member?.email || "BridgeX member";

export default function AdminPaymentReview() {
  const { user } = useAuth();
  const paymentId = new URLSearchParams(window.location.search).get("payment");
  const [payment, setPayment] = useState<PaymentProof | null>(null);
  const [payer, setPayer] = useState<Member | null>(null);
  const [owner, setOwner] = useState<Member | null>(null);
  const [context, setContext] = useState("Loading payment context…");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"verified" | "rejected" | null>(null);

  const load = async () => {
    if (!paymentId) { setLoading(false); setNotice("Choose a payment from Payment verification."); return; }
    setLoading(true); setNotice("");
    const { data, error } = await supabase.from("bridgex_payment_proofs").select("*").eq("id", paymentId).maybeSingle();
    if (error || !data) { setLoading(false); setNotice(error?.message || "Payment record was not found."); return; }
    const record = data as PaymentProof;
    setPayment(record); setNote(record.reviewer_note ?? "");
    const [members, post] = await Promise.all([
      supabase.from("users").select("id,full_name,email,phone").in("id", Array.from(new Set([record.payer_id, record.owner_id]))),
      record.response_kind === "offer" && record.request_id ? supabase.from("send_requests").select("title,purchase_country,purchase_city,destination_country,destination_city").eq("id", record.request_id).maybeSingle() : record.listing_id ? supabase.from("carry_listings").select("origin_country,origin_city,destination_country,destination_city,transport_mode").eq("id", record.listing_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const byId = new Map((members.data ?? []).map((member: Member) => [member.id, member])); setPayer(byId.get(record.payer_id) ?? null); setOwner(byId.get(record.owner_id) ?? null);
    const row: any = post.data;
    setContext(record.response_kind === "offer" ? (row ? `${row.title} · ${row.purchase_city || row.purchase_country} → ${row.destination_city}, ${row.destination_country}` : "Item request") : (row ? `${row.origin_city}, ${row.origin_country} → ${row.destination_city}, ${row.destination_country} · ${row.transport_mode || "Carry space"}` : "Carry-space interest"));
    if (record.proof_path) { const signed = await supabase.storage.from("payment-proofs").createSignedUrl(record.proof_path, 10 * 60); setProofUrl(signed.data?.signedUrl ?? null); }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [paymentId]);
  const decide = async (decision: "verified" | "rejected") => {
    if (!payment || !user || payment.status !== "payment_verifying") return;
    const label = decision === "verified" ? "verify this exact manual payment and open the protected deal" : "reject this payment proof and require a replacement";
    if (!window.confirm(`Confirm: ${label}? This records your administrator decision and notifies the relevant members.`)) return;
    setActing(decision); setNotice("");
    const { data, error } = await supabase.rpc("verify_bridgex_payment", { p_payment_id: payment.id, p_decision: decision, p_reviewer_note: note.trim() || null });
    setActing(null);
    if (error) return setNotice(error.message);
    setNotice(decision === "verified" ? `Payment verified. Protected match ${data ? "created" : "updated"}; both members can now see the workspace order and chat.` : "Payment proof rejected. The sender was asked to correct and resubmit it.");
    await load();
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] text-sm font-semibold text-[#637073]"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading payment review…</main>;
  if (!payment) return <main className="min-h-screen bg-[#f7f5ef] px-5 py-10 text-[#172126]"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8"><Button onClick={() => window.location.assign("/admin/payments")} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Back to payment verification</Button><p className="mt-6 rounded-xl bg-[#f8e8e5] p-4 text-sm font-semibold text-[#9b4b3e]">{notice || "Payment record not found."}</p></div></main>;
  const awaitingReview = payment.status === "payment_verifying";
  return <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#172126] lg:px-8"><div className="mx-auto max-w-6xl"><Button onClick={() => window.location.assign("/admin/payments")} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Payment verification</Button><div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Administrator payment review</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">{payment.reference}</h1><p className="mt-2 text-sm leading-6 text-[#637073]">Review the screenshot and exact payment details before opening member contact details, the protected order, and private chat.</p></div><span className={`rounded-full px-3 py-1.5 text-sm font-bold ${awaitingReview ? "bg-[#fff1ce] text-[#805700]" : payment.status === "verified" ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f5f3ed] text-[#596669]"}`}>{statusLabel(payment.status)}</span></div>{notice && <p className={`mt-5 rounded-xl p-4 text-sm font-semibold ${/verified|rejected|created|updated/.test(notice) ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{notice}</p>}<div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><ImageIcon className="size-5 text-[#176447]" /><h2 className="font-bold">Uploaded payment screenshot</h2></div>{proofUrl ? <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-[#172126]/10 bg-[#f7f5ef]"><img src={proofUrl} alt={`Payment proof for ${payment.reference}`} className="max-h-[620px] w-full object-contain" /><span className="flex items-center justify-center gap-2 border-t border-[#172126]/8 bg-white p-3 text-sm font-bold text-[#176447]">Open original proof <ExternalLink className="size-4" /></span></a> : <div className="mt-5 rounded-2xl border border-dashed border-[#172126]/18 bg-[#f7f5ef] p-8 text-sm text-[#667477]">No screenshot was uploaded yet. Do not verify this payment.</div>}</section><section className="space-y-5"><div className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><ReceiptText className="size-5 text-[#176447]" /><h2 className="font-bold">Payment details</h2></div><dl className="mt-5 grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#687579]">Exact amount</dt><dd className="font-bold">{money(payment.amount, payment.currency)}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#687579]">Payment method</dt><dd className="font-bold">{payment.payment_method === "alipay" ? "Alipay" : payment.payment_method === "wechat_pay" ? "WeChat Pay" : "Not selected"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#687579]">Payer reference</dt><dd className="max-w-[65%] break-all text-right font-bold">{payment.payer_reference || "Not provided"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#687579]">Submitted</dt><dd className="text-right font-bold">{payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : "Not submitted"}</dd></div><div className="border-t border-[#172126]/8 pt-3"><dt className="text-[#687579]">Order context</dt><dd className="mt-1 font-bold leading-6">{context}</dd></div><div className="border-t border-[#172126]/8 pt-3"><dt className="text-[#687579]">Payer</dt><dd className="mt-1 font-bold">{memberLabel(payer)}</dd><dd className="mt-1 text-xs text-[#637073]">{payer?.email || ""}{payer?.phone ? ` · ${payer.phone}` : ""}</dd></div><div className="border-t border-[#172126]/8 pt-3"><dt className="text-[#687579]">Post owner</dt><dd className="mt-1 font-bold">{memberLabel(owner)}</dd></div>{payment.payer_note && <div className="border-t border-[#172126]/8 pt-3"><dt className="text-[#687579]">Payer note</dt><dd className="mt-1 leading-6">{payment.payer_note}</dd></div>}</dl></div><div className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-[#176447]" /><h2 className="font-bold">Verification decision</h2></div><p className="mt-2 text-sm leading-6 text-[#637073]">Check the recipient, amount, reference, and screenshot. Verification will create the protected match and reveal member contact details. Rejection keeps the deal closed and asks for a new screenshot.</p><Textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Reviewer note (required when rejecting; visible to the sender)" className="mt-4 min-h-24 rounded-xl" disabled={!awaitingReview || acting !== null} />{awaitingReview && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void decide("verified")} disabled={acting !== null || !proofUrl} className="rounded-xl bg-[#176447] font-bold">{acting === "verified" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}Payment verified</Button><Button onClick={() => void decide("rejected")} disabled={acting !== null || !note.trim()} variant="outline" className="rounded-xl bg-white text-[#9b4b3e]">{acting === "rejected" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <XCircle className="mr-2 size-4" />}Reject proof</Button></div>}{!awaitingReview && <p className="mt-4 rounded-xl bg-[#f5f3ed] p-3 text-sm font-semibold text-[#596669]">This payment already has a recorded decision. {payment.reviewer_note ? `Reviewer note: ${payment.reviewer_note}` : ""}</p>}</div></section></div></div></main>;
}
