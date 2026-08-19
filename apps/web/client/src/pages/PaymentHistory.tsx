import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/fileUpload";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, CreditCard, FileUp, ImagePlus, Landmark, Loader2, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type PaymentProof = { id: string; reference: string; response_kind: "offer" | "interest"; amount: number; currency: string; status: string; payment_method: "alipay" | "wechat_pay" | null; proof_path: string | null; payer_reference: string | null; payer_note: string | null; submitted_at: string | null; reviewer_note: string | null; created_at: string };
type TravelerPayout = { id: string; order_id: string; amount: number; currency: string; payout_status: "details_required" | "payment_due" | "payment_sent" | "received"; payout_method: "alipay" | "wechat_pay" | "bank_transfer" | null; account_holder: string | null; account_reference: string | null; qr_path: string | null; payment_reference: string | null; administrator_note: string | null; paid_at: string | null; received_at: string | null; created_at: string };
type PayoutProfile = { payout_method: "alipay" | "wechat_pay" | "bank_transfer"; account_holder: string; account_reference: string | null; qr_path: string | null };

const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "BDT", maximumFractionDigits: 2 }).format(Number(amount || 0));
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
const paymentTone = (status: string) => status === "verified" || status === "received" ? "bg-[#dff5ea] text-[#176447]" : status === "payment_verifying" || status === "payment_sent" ? "bg-[#fff1ce] text-[#805700]" : status === "payment_due" ? "bg-[#eef6ff] text-[#205d8e]" : "bg-[#eef1f1] text-[#536164]";

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [payouts, setPayouts] = useState<TravelerPayout[]>([]);
  const [profile, setProfile] = useState<PayoutProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [method, setMethod] = useState<"alipay" | "wechat_pay">("alipay");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qrUrls, setQrUrls] = useState({ alipay: "", wechat: "" });
  const [payoutMethod, setPayoutMethod] = useState<"alipay" | "wechat_pay" | "bank_transfer">("alipay");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountReference, setAccountReference] = useState("");
  const [payoutQr, setPayoutQr] = useState<File | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const paymentParam = new URLSearchParams(window.location.search).get("payment") ?? "";
  const selected = payments.find(item => item.id === selectedId || item.id === paymentParam) ?? payments.find(item => ["pending_payment", "rejected"].includes(item.status)) ?? payments[0] ?? null;
  const counts = useMemo(() => ({ pending: payments.filter(item => ["pending_payment", "rejected"].includes(item.status)).length, verifying: payments.filter(item => item.status === "payment_verifying").length, verified: payments.filter(item => item.status === "verified").length, received: payouts.filter(item => item.payout_status === "received").length }), [payments, payouts]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [paymentResult, payoutResult, profileResult] = await Promise.all([
      supabase.from("bridgex_payment_proofs").select("id,reference,response_kind,amount,currency,status,payment_method,proof_path,payer_reference,payer_note,submitted_at,reviewer_note,created_at").eq("payer_id", user.id).order("created_at", { ascending: false }).limit(80),
      supabase.from("bridgex_traveler_payouts").select("id,order_id,amount,currency,payout_status,payout_method,account_holder,account_reference,qr_path,payment_reference,administrator_note,paid_at,received_at,created_at").eq("traveler_id", user.id).order("created_at", { ascending: false }).limit(80),
      supabase.from("bridgex_traveler_payout_profiles").select("payout_method,account_holder,account_reference,qr_path").eq("traveler_id", user.id).maybeSingle(),
    ]);
    setPayments((paymentResult.data ?? []) as PaymentProof[]);
    setPayouts((payoutResult.data ?? []) as TravelerPayout[]);
    const nextProfile = profileResult.data as PayoutProfile | null;
    setProfile(nextProfile);
    if (nextProfile) { setPayoutMethod(nextProfile.payout_method); setAccountHolder(nextProfile.account_holder); setAccountReference(nextProfile.account_reference ?? ""); }
    setLoading(false);
    const error = paymentResult.error?.message || payoutResult.error?.message || profileResult.error?.message;
    if (error) setNotice(error);
  };

  useEffect(() => { void load(); }, [user?.id]);
  useEffect(() => {
    let active = true;
    if (!user || !payments.length) { setQrUrls({ alipay: "", wechat: "" }); return; }
    void Promise.all([supabase.storage.from("payment-instructions").createSignedUrl("alipay-qr.jpg.jpg", 3600), supabase.storage.from("payment-instructions").createSignedUrl("wechat-pay-qr.jpg.jpg", 3600)]).then(([alipay, wechat]) => { if (active) setQrUrls({ alipay: alipay.data?.signedUrl ?? "", wechat: wechat.data?.signedUrl ?? "" }); });
    return () => { active = false; };
  }, [user?.id, payments.length]);

  const submitProof = async () => {
    if (!user || !selected || !proofFile) return setNotice("Choose a clear payment screenshot before submitting.");
    if (!["pending_payment", "rejected"].includes(selected.status)) return setNotice("This payment proof is already under review or has a final decision.");
    setSubmitting(true); setNotice("");
    try {
      const compressed = await compressImageForUpload(proofFile);
      if (compressed.size > 3 * 1024 * 1024) return setNotice("The screenshot is still larger than 3 MB after compression. Choose a smaller image.");
      const path = `${user.id}/${selected.id}/${crypto.randomUUID()}-${compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("payment-proofs").upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (upload.error) return setNotice(upload.error.message);
      const { error } = await supabase.rpc("submit_bridgex_payment_proof", { p_payment_id: selected.id, p_payment_method: method, p_proof_path: path, p_payer_reference: paymentReference.trim() || null, p_payer_note: paymentNote.trim() || null });
      if (error) return setNotice(error.message);
      setProofFile(null); setPaymentReference(""); setPaymentNote(""); setNotice("Payment screenshot submitted. It is now awaiting administrator verification."); await load();
    } finally { setSubmitting(false); }
  };

  const savePayoutDetails = async () => {
    if (!user || !accountHolder.trim()) return setNotice("Add the account holder name for traveler payout.");
    if (payoutMethod === "bank_transfer" && !accountReference.trim()) return setNotice("Add bank account or routing details for bank transfer.");
    setSavingPayout(true); setNotice("");
    try {
      let qrPath = profile?.qr_path ?? null;
      if (payoutQr) {
        const compressed = await compressImageForUpload(payoutQr);
        if (compressed.size > 3 * 1024 * 1024) return setNotice("The QR image is still larger than 3 MB after compression.");
        qrPath = `${user.id}/${crypto.randomUUID()}-${compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const upload = await supabase.storage.from("traveler-payout-instructions").upload(qrPath, compressed, { contentType: compressed.type, upsert: false });
        if (upload.error) return setNotice(upload.error.message);
      }
      const { error } = await supabase.rpc("save_bridgex_traveler_payout_profile", { p_method: payoutMethod, p_account_holder: accountHolder.trim(), p_account_reference: accountReference.trim() || null, p_qr_path: qrPath });
      if (error) return setNotice(error.message);
      setPayoutQr(null); setNotice("Private traveler payout details saved. Administrators can use them only after a sender releases a completed order."); await load();
    } finally { setSavingPayout(false); }
  };

  const confirmReceived = async (payout: TravelerPayout) => {
    if (!window.confirm("Confirm that you received this traveler payment?")) return;
    const { error } = await supabase.rpc("confirm_bridgex_traveler_payout_received", { p_payout_id: payout.id });
    if (error) return setNotice(error.message);
    setNotice("Payment receipt confirmed. The administrator has been notified."); await load();
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Workspace</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Payment history</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">View every manual payment you sent and, when you travel, the private payout status for completed and released orders.</p><p className="mt-3 text-xs leading-5 text-[#687579]">A 5% BridgeX platform service fee applies to completed transactions. Any applicable amount is shown only within the protected payment flow.</p></div><Link href="/dashboard/offers"><Button className="rounded-xl bg-[#172126] font-bold">Incoming offers</Button></Link></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Pending payment", counts.pending, "Payments ready for your screenshot"], ["Payment verifying", counts.verifying, "Administrator review in progress"], ["Payment verified", counts.verified, "Protected matches opened"], ["Payment received", counts.received, "Traveler payouts confirmed"]].map(([title, count, copy]) => <div key={String(title)} className="rounded-2xl border border-[#172126]/8 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#637073]">{title}</p><p className="mt-4 font-display text-3xl font-bold">{count}</p><p className="mt-1 text-xs text-[#687579]">{copy}</p></div>)}</div>
    {notice && <p className={`mt-5 rounded-xl p-3 text-sm font-semibold ${/saved|submitted|confirmed/.test(notice) ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{notice}</p>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
      <section className="rounded-3xl border border-[#172126]/8 bg-white p-5"><div className="flex items-center gap-2"><WalletCards className="size-5 text-[#176447]" /><div><h2 className="font-bold">Your payment records</h2><p className="mt-1 text-sm text-[#637073]">Paid, pending, verifying, and verified payments stay here.</p></div></div><div className="mt-5 grid gap-2">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading payment history…</p> : payments.length ? payments.map(payment => <button key={payment.id} onClick={() => setSelectedId(payment.id)} className={`rounded-2xl border p-4 text-left ${selected?.id === payment.id ? "border-[#2d8d62] bg-[#edf8f0]" : "border-[#172126]/8 bg-[#fbfaf7]"}`}><div className="flex items-center justify-between gap-2"><strong>{payment.reference}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentTone(payment.status)}`}>{label(payment.status)}</span></div><p className="mt-2 text-sm font-semibold">{money(payment.amount, payment.currency)}</p><p className="mt-1 text-xs text-[#687579]">{payment.response_kind === "offer" ? "Traveler offer" : "Carry-space interest"} · {new Date(payment.created_at).toLocaleDateString()}</p></button>) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">No payment records yet.</p>}</div></section>
      <section className="rounded-3xl border border-[#172126]/8 bg-white p-6">{selected ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Manual payment request</p><h2 className="mt-1 font-display text-2xl font-bold">{selected.reference}</h2><p className="mt-2 text-sm text-[#637073]">Pay exactly <strong className="text-[#172126]">{money(selected.amount, selected.currency)}</strong>. Alipay and WeChat Pay QR transfers are reviewed manually before the protected match opens.</p></div><Badge className={paymentTone(selected.status)}>{label(selected.status)}</Badge></div>{["pending_payment", "rejected"].includes(selected.status) ? <><div className="mt-5 rounded-2xl border border-[#e4c984] bg-[#fff9ea] p-4 text-sm leading-6 text-[#765b1a]"><strong>Use the exact amount shown above.</strong><p className="mt-1">A wrong amount, unclear proof, or transfer to another account cannot be verified. False proof may result in account review.</p>{selected.status === "rejected" && selected.reviewer_note && <p className="mt-2 font-semibold">Administrator note: {selected.reviewer_note}</p>}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={`overflow-hidden rounded-2xl border-2 p-3 ${method === "alipay" ? "border-[#1677ff] bg-[#eef6ff]" : "border-transparent bg-[#f7f5ef]"}`}><input className="sr-only" type="radio" checked={method === "alipay"} onChange={() => setMethod("alipay")} />{qrUrls.alipay ? <img src={qrUrls.alipay} alt="Alipay payment QR" className="mx-auto aspect-square w-full max-w-[240px] rounded-xl object-contain" /> : <div className="grid aspect-square place-items-center rounded-xl bg-white text-xs text-[#637073]">Loading secure QR…</div>}<p className="mt-3 text-center font-bold text-[#1677ff]">Pay with Alipay</p></label><label className={`overflow-hidden rounded-2xl border-2 p-3 ${method === "wechat_pay" ? "border-[#09bb07] bg-[#edfaef]" : "border-transparent bg-[#f7f5ef]"}`}><input className="sr-only" type="radio" checked={method === "wechat_pay"} onChange={() => setMethod("wechat_pay")} />{qrUrls.wechat ? <img src={qrUrls.wechat} alt="WeChat Pay payment QR" className="mx-auto aspect-square w-full max-w-[240px] rounded-xl object-contain" /> : <div className="grid aspect-square place-items-center rounded-xl bg-white text-xs text-[#637073]">Loading secure QR…</div>}<p className="mt-3 text-center font-bold text-[#078d06]">Pay with WeChat Pay</p></label></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Transfer reference (optional)<Input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} className="h-11 rounded-xl" placeholder="Reference in your payment app" /></label><label className="grid gap-2 text-sm font-bold">Payment screenshot<span className="flex h-11 cursor-pointer items-center rounded-xl border border-[#172126]/12 bg-[#fbfaf7] px-3 text-sm"><FileUp className="mr-2 size-4" />{proofFile?.name || "Choose screenshot"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setProofFile(event.target.files?.[0] ?? null)} /></span></label></div><label className="mt-4 grid gap-2 text-sm font-bold">Note for review (optional)<Textarea value={paymentNote} onChange={event => setPaymentNote(event.target.value)} className="min-h-20 rounded-xl" /></label><Button onClick={() => void submitProof()} disabled={submitting || !proofFile} className="mt-5 rounded-xl bg-[#176447] font-bold">{submitting ? "Submitting…" : "Submit payment screenshot"}</Button></> : <div className={`mt-6 rounded-2xl p-5 text-sm ${selected.status === "verified" ? "bg-[#dff5ea] text-[#176447]" : "bg-[#fff7e5] text-[#805700]"}`}><strong>{selected.status === "verified" ? "Payment verified" : "Payment verifying"}</strong><p className="mt-1">{selected.status === "verified" ? "Your protected match and chat are now available." : "Your screenshot is awaiting administrator review. Do not pay a second time unless it is rejected."}</p></div>}</> : <div className="rounded-2xl bg-[#f5f3ed] p-6 text-sm text-[#637073]">Select a payment record to view its instructions.</div>}</section>
    </div>
    <section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Traveler payout details</p><h2 className="mt-1 text-xl font-bold">Private payout QR or bank details</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">Before marking an order Delivered, travelers save the payout account that authorized administrators can use only after the sender confirms receipt and releases the order.</p></div><Landmark className="size-6 text-[#176447]" /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Payout method<select value={payoutMethod} onChange={event => setPayoutMethod(event.target.value as typeof payoutMethod)} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm"><option value="alipay">Alipay</option><option value="wechat_pay">WeChat Pay</option><option value="bank_transfer">Bank transfer</option></select></label><label className="grid gap-2 text-sm font-bold">Account holder name<Input value={accountHolder} onChange={event => setAccountHolder(event.target.value)} className="h-11 rounded-xl" placeholder="Name used by your payout account" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">{payoutMethod === "bank_transfer" ? "Bank account / routing details" : "Payout ID or account reference (optional)"}<Input value={accountReference} onChange={event => setAccountReference(event.target.value)} className="h-11 rounded-xl" placeholder={payoutMethod === "bank_transfer" ? "Bank name, account number, routing details" : "Wallet ID, phone, or account reference"} /></label>{payoutMethod !== "bank_transfer" && <label className="grid gap-2 text-sm font-bold md:col-span-2">Private payout QR image (optional)<span className="flex h-11 cursor-pointer items-center rounded-xl border border-[#172126]/12 bg-[#fbfaf7] px-3 text-sm"><ImagePlus className="mr-2 size-4" />{payoutQr?.name || (profile?.qr_path ? "Current private QR saved — choose to replace" : "Choose your QR image")}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPayoutQr(event.target.files?.[0] ?? null)} /></span></label>}</div><Button onClick={() => void savePayoutDetails()} disabled={savingPayout} className="mt-5 rounded-xl bg-[#172126] font-bold">{savingPayout ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : "Save private payout details"}</Button></section>
    <section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><CreditCard className="size-5 text-[#176447]" /><div><h2 className="font-bold">Traveler payout history</h2><p className="mt-1 text-sm text-[#637073]">A payout becomes due only after the sender confirms receipt and releases a delivered order.</p></div></div><div className="mt-5 grid gap-3">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading traveler payouts…</p> : payouts.length ? payouts.map(payout => <article key={payout.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-[#f6f4ee] p-4"><div><p className="font-bold">{money(payout.amount, payout.currency)}</p><p className="mt-1 text-sm text-[#637073]">{payout.payout_method ? label(payout.payout_method) : "Payout details required"} · Released {new Date(payout.created_at).toLocaleDateString()}</p>{payout.payment_reference && <p className="mt-1 text-xs text-[#687579]">Administrator payment reference: {payout.payment_reference}</p>}{payout.administrator_note && <p className="mt-1 text-xs text-[#687579]">Note: {payout.administrator_note}</p>}</div><div className="flex items-center gap-2"><Badge className={paymentTone(payout.payout_status)}>{label(payout.payout_status)}</Badge>{payout.payout_status === "payment_sent" && <Button onClick={() => void confirmReceived(payout)} size="sm" className="rounded-lg bg-[#176447]"><CheckCircle2 className="mr-1.5 size-4" />Confirm received</Button>}</div></article>) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Traveler payouts appear here after sender-confirmed release.</p>}</div></section>
  </div>;
}
