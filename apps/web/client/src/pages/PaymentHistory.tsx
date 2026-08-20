import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/fileUpload";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ChevronRight, CreditCard, FileUp, ImagePlus, Landmark, Loader2, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type PaymentProof = { id: string; reference: string; response_kind: "offer" | "interest"; amount: number; currency: string; settlement_currency: string | null; settlement_amount: number | null; exchange_rate: number | null; exchange_rate_updated_at: string | null; status: string; payment_method: "alipay" | "wechat_pay" | null; payer_reference: string | null; payer_note: string | null; submitted_at: string | null; reviewer_note: string | null; created_at: string };
type TravelerPayout = { id: string; order_id: string; amount: number; currency: string; payout_status: "details_required" | "payment_due" | "payment_sent" | "received"; payout_method: "alipay" | "wechat_pay" | "bank_transfer" | null; account_holder: string | null; account_reference: string | null; qr_path: string | null; payment_reference: string | null; administrator_note: string | null; paid_at: string | null; received_at: string | null; created_at: string };
type PayoutProfile = { payout_method: "alipay" | "wechat_pay" | "bank_transfer"; account_holder: string; account_reference: string | null; qr_path: string | null };

const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "BDT", maximumFractionDigits: 2 }).format(Number(amount || 0));
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
const tone = (status: string) => status === "verified" || status === "received" ? "bg-[#dff5ea] text-[#176447]" : status === "payment_verifying" || status === "payment_sent" ? "bg-[#fff1ce] text-[#805700]" : status === "payment_due" ? "bg-[#eef6ff] text-[#205d8e]" : "bg-[#eef1f1] text-[#536164]";
const nativeInput = "h-11 w-full rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm outline-none focus:border-[#2d8d62] focus:ring-2 focus:ring-[#2d8d62]/20";
const SettlementCard = ({ payment }: { payment: PaymentProof }) => payment.settlement_currency && payment.settlement_amount !== null && payment.exchange_rate !== null ? <div className="mt-6 rounded-2xl border border-[#a8d7bb] bg-[#f1faf4] p-5 text-[#25553a]"><p className="text-xs font-bold uppercase tracking-[0.14em]">Amount to pay</p><p className="mt-2 font-display text-4xl font-bold tracking-[-0.05em]">{money(payment.settlement_amount, "CNY")}</p><p className="mt-2 text-sm">Converted to CNY for this payment.</p></div> : <div className="mt-6 rounded-2xl border border-[#e4c984] bg-[#fff9ea] p-4 text-sm leading-6 text-[#765b1a]"><strong>CNY amount unavailable.</strong><p className="mt-1">A current payment amount must be published before this payment can begin.</p></div>;
const paymentStatuses = ["pending", "verifying", "verified", "received"] as const;
type PaymentStatusRoute = typeof paymentStatuses[number];

function PageHeader({ eyebrow = "Workspace", title, copy, backHref, backLabel = "Back to Payments", actions }: { eyebrow?: string; title: string; copy: string; backHref?: string; backLabel?: string; actions?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">{copy}</p></div><div className="flex flex-wrap gap-2">{actions}{backHref && <Link href={backHref}><Button className="rounded-xl bg-[#172126] font-bold">{backLabel}</Button></Link>}</div></div>;
}

export default function PaymentHistory({ mode = "payments" }: { mode?: "payments" | "payouts" }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [payouts, setPayouts] = useState<TravelerPayout[]>([]);
  const [profile, setProfile] = useState<PayoutProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [method, setMethod] = useState<"alipay" | "wechat_pay">("alipay");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutProfile["payout_method"]>("alipay");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountReference, setAccountReference] = useState("");
  const [payoutQr, setPayoutQr] = useState<File | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const [confirmingPayoutId, setConfirmingPayoutId] = useState("");
  const [paymentQrUrls, setPaymentQrUrls] = useState({ alipay: "", wechat_pay: "" });

  const segments = location.split("/").filter(Boolean);
  const routeType = segments[2] ?? "";
  const recordId = routeType === "record" ? segments[3] ?? "" : "";
  const statusView = paymentStatuses.includes(routeType as PaymentStatusRoute) ? routeType as PaymentStatusRoute : "";
  const selectedPayment = payments.find(item => item.id === recordId) ?? null;
  const selectedPayout = payouts.find(item => item.id === recordId) ?? null;
  const counts = useMemo(() => ({ pending: payments.filter(item => ["pending_payment", "rejected"].includes(item.status)).length, verifying: payments.filter(item => item.status === "payment_verifying").length, verified: payments.filter(item => item.status === "verified").length, received: payouts.filter(item => item.payout_status === "received").length }), [payments, payouts]);
  const statusCards = [["pending", "Pending payment", counts.pending, "Payment record needs attention"], ["verifying", "Payment verifying", counts.verifying, "Review is in progress"], ["verified", "Payment verified", counts.verified, "Protected matches opened"], ["received", "Payment received", counts.received, "Traveler payouts confirmed"]] as const;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [paymentResult, payoutResult, profileResult] = await Promise.all([
      supabase.from("bridgex_payment_proofs").select("id,reference,response_kind,amount,currency,settlement_currency,settlement_amount,exchange_rate,exchange_rate_updated_at,status,payment_method,payer_reference,payer_note,submitted_at,reviewer_note,created_at").eq("payer_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("bridgex_traveler_payouts").select("id,order_id,amount,currency,payout_status,payout_method,account_holder,account_reference,qr_path,payment_reference,administrator_note,paid_at,received_at,created_at").eq("traveler_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("bridgex_traveler_payout_profiles").select("payout_method,account_holder,account_reference,qr_path").eq("traveler_id", user.id).maybeSingle(),
    ]);
    setPayments((paymentResult.data ?? []) as PaymentProof[]);
    setPayouts((payoutResult.data ?? []) as TravelerPayout[]);
    const next = profileResult.data as PayoutProfile | null;
    setProfile(next);
    if (next) { setPayoutMethod(next.payout_method); setAccountHolder(next.account_holder); setAccountReference(next.account_reference ?? ""); }
    setLoading(false);
    const error = paymentResult.error?.message || payoutResult.error?.message || profileResult.error?.message;
    if (error) setNotice(error);
  };

  useEffect(() => { void load(); }, [user?.id]);
  useEffect(() => { if (!user) return; let active = true; void Promise.all([supabase.storage.from("payment-instructions").createSignedUrl("alipay-qr.jpg.jpg", 60 * 60), supabase.storage.from("payment-instructions").createSignedUrl("wechat-pay-qr.jpg.jpg", 60 * 60)]).then(([alipay, wechat]) => { if (active) setPaymentQrUrls({ alipay: alipay.data?.signedUrl ?? "", wechat_pay: wechat.data?.signedUrl ?? "" }); }); return () => { active = false; }; }, [user?.id]);

  const submitProof = async () => {
    if (!user || !selectedPayment || !proofFile) return setNotice("Choose a clear payment screenshot before submitting.");
    if (!["pending_payment", "rejected"].includes(selectedPayment.status)) return setNotice("This payment is already under review or complete.");
    setSubmitting(true); setNotice("");
    try {
      if (!proofFile.type.startsWith("image/")) return setNotice("Choose an image screenshot from your gallery or files app.");
      const file = await compressImageForUpload(proofFile);
      if (file.size > 3 * 1024 * 1024) return setNotice("The screenshot is still larger than 3 MB after compression. Choose a smaller clear image.");
      const path = `${user.id}/${selectedPayment.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) return setNotice(`Screenshot upload failed: ${upload.error.message}`);
      const { error } = await supabase.rpc("submit_bridgex_payment_proof", { p_payment_id: selectedPayment.id, p_payment_method: method, p_proof_path: path, p_payer_reference: reference.trim() || null, p_payer_note: note.trim() || null });
      if (error) { await supabase.storage.from("payment-proofs").remove([path]); return setNotice(`Screenshot was not recorded: ${error.message}`); }
      setProofFile(null); setReference(""); setNote(""); setNotice("Payment evidence submitted for review."); await load();
    } finally { setSubmitting(false); }
  };

  const savePayoutDetails = async () => {
    if (!user || !accountHolder.trim()) return setNotice("Add the account holder name.");
    if (payoutMethod === "bank_transfer" && !accountReference.trim()) return setNotice("Add bank account or routing details.");
    setSavingPayout(true); setNotice("");
    try {
      let qrPath = profile?.qr_path ?? null;
      if (payoutQr) {
        const file = await compressImageForUpload(payoutQr);
        qrPath = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const upload = await supabase.storage.from("traveler-payout-instructions").upload(qrPath, file, { contentType: file.type, upsert: false });
        if (upload.error) return setNotice(upload.error.message);
      }
      const { error } = await supabase.rpc("save_bridgex_traveler_payout_profile", { p_method: payoutMethod, p_account_holder: accountHolder.trim(), p_account_reference: accountReference.trim() || null, p_qr_path: qrPath });
      if (error) return setNotice(error.message);
      setPayoutQr(null); setNotice("Private payout details saved."); await load();
    } finally { setSavingPayout(false); }
  };

  const confirmReceived = async (payout: TravelerPayout) => {
    if (confirmingPayoutId !== payout.id) return setConfirmingPayoutId(payout.id);
    const { error } = await supabase.rpc("confirm_bridgex_traveler_payout_received", { p_payout_id: payout.id });
    if (error) return setNotice(error.message);
    setConfirmingPayoutId(""); setNotice("Payment receipt confirmed."); await load();
  };

  const proofPreview = proofFile ? URL.createObjectURL(proofFile) : "";
  const message = notice && <p className={`mt-5 rounded-xl p-3 text-sm font-semibold ${/saved|submitted|confirmed/.test(notice) ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{notice}</p>;
  const RecordLink = ({ payment }: { payment: PaymentProof }) => <Link href={`/dashboard/payments/record/${payment.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-[#172126]/8 bg-[#fbfaf7] p-4 transition hover:border-[#2d8d62]/45 hover:bg-[#f4faf6]"><div><p className="font-bold">{payment.reference}</p><p className="mt-1 text-sm font-semibold">{money(payment.amount, payment.currency)}</p>{payment.settlement_currency && payment.settlement_amount !== null && <p className="mt-1 text-xs font-bold text-[#176447]">Pay {money(payment.settlement_amount, payment.settlement_currency)}</p>}<p className="mt-1 text-xs text-[#687579]">{payment.response_kind === "offer" ? "Traveler offer" : "Carry-space interest"} · {new Date(payment.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Badge className={tone(payment.status)}>{label(payment.status)}</Badge><ChevronRight className="size-4 text-[#637073] transition group-hover:translate-x-0.5" /></div></Link>;
  const PayoutLink = ({ payout }: { payout: TravelerPayout }) => <Link href={`/dashboard/payouts/record/${payout.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-[#172126]/8 bg-[#fbfaf7] p-4 transition hover:border-[#2d8d62]/45 hover:bg-[#f4faf6]"><div><p className="font-bold">{money(payout.amount, payout.currency)}</p><p className="mt-1 text-sm text-[#637073]">Order {payout.order_id.slice(0, 8)} · {new Date(payout.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Badge className={tone(payout.payout_status)}>{label(payout.payout_status)}</Badge><ChevronRight className="size-4 text-[#637073] transition group-hover:translate-x-0.5" /></div></Link>;
  const PayoutSetup = () => <section className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Traveler payout details</p><h2 className="mt-1 text-xl font-bold">Private payout account</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">Save reusable private payout details for eligible completed orders.</p></div><Landmark className="size-6 text-[#176447]" /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Payout method<select value={payoutMethod} onChange={event => setPayoutMethod(event.target.value as PayoutProfile["payout_method"])} className={nativeInput}><option value="alipay">Alipay</option><option value="wechat_pay">WeChat Pay</option><option value="bank_transfer">Bank transfer</option></select></label><label className="grid gap-2 text-sm font-bold">Account holder name<input value={accountHolder} onChange={event => setAccountHolder(event.target.value)} autoComplete="name" className={nativeInput} placeholder="Name used by your payout account" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">{payoutMethod === "bank_transfer" ? "Bank account / routing details" : "Payout ID or account reference (optional)"}<input value={accountReference} onChange={event => setAccountReference(event.target.value)} autoComplete="off" className={nativeInput} placeholder={payoutMethod === "bank_transfer" ? "Bank name, account number, routing details" : "Wallet ID, phone, or account reference"} /></label>{payoutMethod !== "bank_transfer" && <label className="grid gap-2 text-sm font-bold md:col-span-2">Private payout QR image (optional)<span className="flex h-11 cursor-pointer items-center rounded-xl border border-[#172126]/12 bg-[#fbfaf7] px-3 text-sm"><ImagePlus className="mr-2 size-4" />{payoutQr?.name || (profile?.qr_path ? "Private QR saved — choose to replace" : "Choose your QR image")}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPayoutQr(event.target.files?.[0] ?? null)} /></span></label>}</div><Button onClick={() => void savePayoutDetails()} disabled={savingPayout} className="mt-5 rounded-xl bg-[#172126] font-bold">{savingPayout ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : "Save private payout details"}</Button></section>;

  if (mode === "payouts" && routeType === "record") {
    if (!loading && !selectedPayout) return <><PageHeader title="Payout not found" copy="This payout record is unavailable or no longer belongs to this account." backHref="/dashboard/payouts" backLabel="Back to payouts" />{message}</>;
    return <><PageHeader eyebrow="Traveler payouts" title={selectedPayout ? money(selectedPayout.amount, selectedPayout.currency) : "Loading payout"} copy="Review this completed-order payout and complete any remaining confirmation." backHref="/dashboard/payouts" backLabel="Back to payouts" />{message}<section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6">{loading || !selectedPayout ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading payout record…</p> : <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Completed-order payout</p><h2 className="mt-1 text-2xl font-bold">Order {selectedPayout.order_id.slice(0, 8)}</h2><p className="mt-2 text-sm text-[#637073]">Created {new Date(selectedPayout.created_at).toLocaleString()}</p></div><Badge className={tone(selectedPayout.payout_status)}>{label(selectedPayout.payout_status)}</Badge></div><div className="mt-6 grid gap-3 rounded-2xl bg-[#f6f4ee] p-4 text-sm sm:grid-cols-2"><p><strong>Method:</strong> {selectedPayout.payout_method ? label(selectedPayout.payout_method) : "Payout details required"}</p><p><strong>Account holder:</strong> {selectedPayout.account_holder || "Not provided"}</p><p><strong>Payment reference:</strong> {selectedPayout.payment_reference || "Not recorded"}</p><p><strong>Sent:</strong> {selectedPayout.paid_at ? new Date(selectedPayout.paid_at).toLocaleString() : "Not sent"}</p>{selectedPayout.administrator_note && <p className="sm:col-span-2"><strong>Administrator note:</strong> {selectedPayout.administrator_note}</p>}</div>{selectedPayout.payout_status === "payment_sent" && <Button onClick={() => void confirmReceived(selectedPayout)} className="mt-6 rounded-xl bg-[#176447] font-bold"><CheckCircle2 className="mr-2 size-4" />{confirmingPayoutId === selectedPayout.id ? "Confirm receipt now" : "Confirm received"}</Button>}{selectedPayout.payout_status === "details_required" && <Link href="/dashboard/payouts"><Button className="mt-6 rounded-xl bg-[#172126] font-bold">Add payout details</Button></Link>}</>}</section></>;
  }

  if (mode === "payouts") return <><PageHeader title="Traveler payouts" copy="Manage payout records and private payout details." backHref="/dashboard/payments" backLabel="Payments" />{message}<div className="mt-7 grid gap-7"><section className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><CreditCard className="size-5 text-[#176447]" /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Traveler payouts</p><h2 className="mt-1 font-bold">Traveler payout history</h2></div></div><div className="mt-5 grid gap-3">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading traveler payouts…</p> : payouts.length ? payouts.map(payout => <PayoutLink key={payout.id} payout={payout} />) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Traveler payouts appear here after completed orders are released.</p>}</div></section><PayoutSetup /></div></>;

  if (routeType === "record") {
    if (!loading && !selectedPayment) return <><PageHeader title="Payment not found" copy="This payment record is unavailable or no longer belongs to this account." backHref="/dashboard/payments" />{message}</>;
    return <><PageHeader eyebrow="Payments" title={selectedPayment?.reference || "Loading payment"} copy="Review the protected payment record and complete any remaining action." backHref="/dashboard/payments" />{message}<section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6">{loading || !selectedPayment ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading payment record…</p> : <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Protected payment record</p><h2 className="mt-1 font-display text-2xl font-bold">{money(selectedPayment.amount, selectedPayment.currency)}</h2></div><Badge className={tone(selectedPayment.status)}>{label(selectedPayment.status)}</Badge></div><SettlementCard payment={selectedPayment} />{["pending_payment", "rejected"].includes(selectedPayment.status) ? <><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setMethod("alipay")} className={`rounded-2xl border p-4 font-bold ${method === "alipay" ? "border-[#1677ff] bg-[#eef6ff] text-[#1677ff]" : "border-[#172126]/10"}`}>Alipay</button><button onClick={() => setMethod("wechat_pay")} className={`rounded-2xl border p-4 font-bold ${method === "wechat_pay" ? "border-[#09bb07] bg-[#edfaef] text-[#078d06]" : "border-[#172126]/10"}`}>WeChat Pay</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Transfer reference (optional)<input value={reference} onChange={event => setReference(event.target.value)} className={nativeInput} /></label><label className="grid gap-2 text-sm font-bold">Payment screenshot (required)<span className="flex h-11 cursor-pointer items-center rounded-xl border border-[#172126]/12 bg-[#fbfaf7] px-3 text-sm"><FileUp className="mr-2 size-4" />{proofFile?.name || "Choose screenshot"}<input className="sr-only" type="file" accept="image/*" onChange={event => setProofFile(event.target.files?.[0] ?? null)} /></span></label></div>{proofPreview && <img src={proofPreview} alt="Selected payment screenshot" className="mt-4 max-h-52 rounded-xl border object-contain" />}<Button onClick={() => void submitProof()} disabled={submitting || !proofFile} className="mt-5 rounded-xl bg-[#176447] font-bold">{submitting ? "Uploading and recording…" : "Submit payment screenshot"}</Button></> : <div className="mt-6 rounded-2xl bg-[#fff7e5] p-5 text-sm text-[#805700]"><strong>{selectedPayment.status === "verified" ? "Payment verified" : "Payment verifying"}</strong><p className="mt-1">Your evidence is awaiting review.</p></div>}</>}</section></>;
  }

  if (statusView) {
    const card = statusCards.find(item => item[0] === statusView)!;
    const filteredPayments = statusView === "pending" ? payments.filter(item => ["pending_payment", "rejected"].includes(item.status)) : statusView === "verifying" ? payments.filter(item => item.status === "payment_verifying") : statusView === "verified" ? payments.filter(item => item.status === "verified") : [];
    const filteredPayouts = statusView === "received" ? payouts.filter(item => item.payout_status === "received") : [];
    return <><PageHeader eyebrow="Payments" title={card[1]} copy={card[3]} backHref="/dashboard/payments" />{message}<section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-5"><div className="grid gap-3">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading records…</p> : statusView === "received" ? filteredPayouts.length ? filteredPayouts.map(payout => <PayoutLink key={payout.id} payout={payout} />) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">No confirmed traveler payouts yet.</p> : filteredPayments.length ? filteredPayments.map(payment => <RecordLink key={payment.id} payment={payment} />) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">No records in this status.</p>}</div></section></>;
  }

  return <><PageHeader title="Payments" copy="Manage protected payment records and traveler payouts." actions={<><Link href="/dashboard/payouts"><Button variant="outline" className="rounded-xl bg-white">Traveler payouts</Button></Link><Link href="/dashboard/offers"><Button className="rounded-xl bg-[#172126] font-bold">Incoming offers</Button></Link></>} /><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statusCards.map(([key, title, count, copy]) => <Link key={key} href={`/dashboard/payments/${key}`} className="rounded-2xl border border-[#172126]/8 bg-white p-4 transition hover:border-[#2d8d62]/45 hover:bg-[#f4faf6]"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#637073]">{title}</p><p className="mt-4 font-display text-3xl font-bold">{count}</p><p className="mt-1 text-xs text-[#687579]">{copy}</p></Link>)}</div>{message}<section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-5"><div className="flex items-center gap-2"><WalletCards className="size-5 text-[#176447]" /><div><h2 className="font-bold">Recent payment records</h2><p className="mt-1 text-sm text-[#637073]">Open any record to view its current status and available action.</p></div></div><div className="mt-5 grid gap-2">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading payments…</p> : payments.length ? payments.slice(0, 10).map(payment => <RecordLink key={payment.id} payment={payment} />) : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">No payment records yet.</p>}</div></section></>;
}
