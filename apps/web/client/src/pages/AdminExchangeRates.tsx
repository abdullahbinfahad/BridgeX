import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CircleDollarSign, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type ExchangeRate = { id: string; base_currency: string; quote_currency: string; rate: number; effective_at: string; updated_at: string; updated_by: string };
const currencies = ["BDT", "CNY", "USD", "EUR", "GBP", "AED", "SAR", "INR", "JPY", "CAD", "AUD", "NZD", "SGD", "HKD", "MYR", "THB", "IDR", "KRW", "PKR", "NPR", "LKR", "TRY", "ZAR", "BRL", "MXN", "CHF", "SEK", "NOK", "DKK", "PLN"];

export default function AdminExchangeRates() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [base, setBase] = useState("BDT");
  const [quote, setQuote] = useState("CNY");
  const [rate, setRate] = useState("");
  const [effectiveAt, setEffectiveAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bridgex_exchange_rates").select("id,base_currency,quote_currency,rate,effective_at,updated_at,updated_by").order("base_currency").order("quote_currency").limit(200);
    setLoading(false);
    if (error) return setNotice(error.message);
    setRates((data ?? []) as ExchangeRate[]);
  };
  useEffect(() => { void load(); }, []);
  const selected = useMemo(() => rates.find(item => item.base_currency === base && item.quote_currency === quote) ?? null, [rates, base, quote]);
  useEffect(() => { if (selected) { setRate(String(selected.rate)); setEffectiveAt(new Date(selected.effective_at).toISOString().slice(0, 16)); } else setRate(""); }, [selected?.id, base, quote]);
  const save = async () => {
    if (!user || user.role !== "admin" && user.role !== "super_admin") return setNotice("Administrator access is required.");
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate) || numericRate <= 0) return setNotice("Enter a positive exchange rate.");
    if (base === quote) return setNotice("Choose two different currencies.");
    setSaving(true); setNotice("");
    const { error } = await supabase.rpc("save_bridgex_exchange_rate", { p_base_currency: base, p_quote_currency: quote, p_rate: numericRate, p_effective_at: new Date(effectiveAt).toISOString() });
    setSaving(false);
    if (error) return setNotice(error.message);
    setNotice(`${base} → ${quote} rate published. New payment records will snapshot this rate.`);
    await load();
  };
  return <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#172126] lg:px-8"><div className="mx-auto max-w-6xl"><Button onClick={() => setLocation("/admin")} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Control panel</Button><div className="mt-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">BridgeX administrator</p><h1 className="mt-2 font-display text-4xl font-bold">Payment exchange rates</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637073]">Publish the daily rate used to convert a member’s payment currency into the required CNY settlement amount. BDT → CNY is selected by default. A payment snapshots its rate when it starts, so later updates do not change an existing payment request.</p></div><Button onClick={() => void load()} variant="outline" className="rounded-xl bg-white"><RefreshCw className="mr-2 size-4" />Refresh</Button></div>{notice && <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${/published/.test(notice) ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{notice}</p>}<section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-3"><CircleDollarSign className="size-6 text-[#176447]" /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Daily platform rate</p><h2 className="mt-1 text-xl font-bold">Publish or update a currency pair</h2></div></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><label className="grid gap-2 text-sm font-bold">From currency<select value={base} onChange={event => setBase(event.target.value)} className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm"><option value="BDT">BDT — Bangladeshi taka</option>{currencies.filter(code => code !== "BDT").map(code => <option key={code} value={code}>{code}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">To currency<select value={quote} onChange={event => setQuote(event.target.value)} className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm"><option value="CNY">CNY — Chinese yuan</option>{currencies.filter(code => code !== "CNY").map(code => <option key={code} value={code}>{code}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Rate<input value={rate} onChange={event => setRate(event.target.value)} inputMode="decimal" className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm" placeholder={`1 ${base} = ? ${quote}`} /></label><label className="grid gap-2 text-sm font-bold">Effective at<input value={effectiveAt} onChange={event => setEffectiveAt(event.target.value)} type="datetime-local" className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm" /></label></div><p className="mt-4 rounded-xl bg-[#fff9ea] p-3 text-sm leading-6 text-[#765b1a]">Enter the number of <strong>{quote}</strong> for one <strong>{base}</strong>. Verify the rate against your authorized daily source before publishing. This is a platform settlement instruction, not market advice.</p><Button onClick={() => void save()} disabled={saving} className="mt-5 rounded-xl bg-[#176447] font-bold"><Save className="mr-2 size-4" />{saving ? "Publishing…" : `Publish ${base} → ${quote} rate`}</Button></section><section className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6"><h2 className="font-bold">Published rates</h2><p className="mt-1 text-sm text-[#637073]">Only newly started payment records use an updated rate; existing records retain their conversion snapshot.</p><div className="mt-5 overflow-x-auto">{loading ? <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">Loading published rates…</p> : rates.length ? <table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#172126]/8 text-xs uppercase tracking-[0.1em] text-[#7a8685]"><tr><th className="pb-3">Pair</th><th className="pb-3">Rate</th><th className="pb-3">Effective</th><th className="pb-3">Updated</th></tr></thead><tbody>{rates.map(item => <tr key={item.id} className="border-b border-[#172126]/7"><td className="py-3 font-bold">{item.base_currency} → {item.quote_currency}</td><td className="py-3">1 {item.base_currency} = {Number(item.rate).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.quote_currency}</td><td className="py-3 text-[#637073]">{new Date(item.effective_at).toLocaleString()}</td><td className="py-3 text-[#637073]">{new Date(item.updated_at).toLocaleString()}</td></tr>)}</tbody></table> : <p className="rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#637073]">No rates have been published yet. Publish BDT → CNY before a BDT payment can start.</p>}</div></section></div></main>;
}
