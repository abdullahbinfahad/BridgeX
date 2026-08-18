import { Brand } from "@/components/bridgex/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BANGLADESH_DISTRICTS, citiesForDistrict } from "@shared/bridgex";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [district, setDistrict] = useState("Dhaka");
  const [city, setCity] = useState("Dhaka City");
  const [accountType, setAccountType] = useState<"sender" | "traveler" | "both">("both");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cities = useMemo(() => citiesForDistrict(district), [district]);

  const submit = async () => {
    if (!user) return setLocation("/access");
    setSaving(true); setError("");
    const { error: saveError } = await supabase.from("users").update({
      full_name: name || user.user_metadata?.full_name || "BridgeX member",
      phone: phone || null,
      district, city, account_type: accountType, onboarding_complete: true,
    }).eq("id", user.id);
    setSaving(false);
    if (saveError) return setError(saveError.message);
    setLocation("/dashboard/verification");
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] text-sm font-semibold text-[#627072]">Preparing your BridgeX account…</div>;
  if (!isAuthenticated) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><div className="max-w-md rounded-3xl border border-[#172126]/8 bg-white p-8 text-center"><Brand className="justify-center" /><h1 className="mt-7 font-display text-3xl font-bold tracking-[-0.05em]">Sign in to continue</h1><p className="mt-3 text-sm leading-6 text-[#657275]">Create a secure account before finishing your BridgeX profile.</p><Button onClick={() => setLocation("/access")} className="mt-6 h-11 w-full rounded-xl bg-[#172126] font-bold">Continue securely</Button></div></div>;

  return <main className="min-h-screen bg-[#f7f5ef] px-5 py-10"><div className="mx-auto max-w-2xl"><Brand /><div className="mt-9 grid gap-5 lg:grid-cols-[1fr_0.55fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Account setup</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Finish your trusted profile.</h1><p className="mt-3 text-sm leading-6 text-[#647174]">This information supports correct matching, Bangladesh delivery addresses, and later verification.</p></div><div className="rounded-2xl bg-[#172126] p-5 text-[#f7f5ef]"><ShieldCheck className="size-5 text-[#91e7bc]" /><p className="mt-3 text-sm font-bold">Step 1 of 2</p><p className="mt-1 text-xs leading-5 text-[#c3d0c9]">Save your profile, then submit identity verification.</p></div></div><section className="mt-8 rounded-3xl border border-[#172126]/8 bg-white p-6 sm:p-8"><div className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2"><div><Label>Display name</Label><Input value={name} onChange={event => setName(event.target.value)} placeholder={user?.user_metadata?.full_name ?? "Your name"} className="mt-2 h-11 rounded-xl" /></div><div><Label>Mobile number</Label><Input value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" placeholder="+880 1XXXXXXXXX" className="mt-2 h-11 rounded-xl" /></div></div><div><Label>Account type</Label><select value={accountType} onChange={event => setAccountType(event.target.value as typeof accountType)} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7cf] bg-[#f9f8f4] px-3 text-sm"><option value="both">Sender and traveler</option><option value="sender">Sender only</option><option value="traveler">Traveler only</option></select></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Bangladesh delivery district</Label><select value={district} onChange={event => { setDistrict(event.target.value); setCity(citiesForDistrict(event.target.value)[0]); }} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7cf] bg-[#f9f8f4] px-3 text-sm">{BANGLADESH_DISTRICTS.map(value => <option key={value}>{value}</option>)}</select></div><div><Label>City or area</Label><select value={city} onChange={event => setCity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d9d7cf] bg-[#f9f8f4] px-3 text-sm">{cities.map(value => <option key={value}>{value}</option>)}</select></div></div><Button onClick={submit} disabled={saving} className="h-12 rounded-xl bg-[#172126] font-bold">{saving ? "Saving profile…" : "Save and continue to verification"}<ArrowRight className="ml-2 size-4" /></Button>{error && <p className="text-sm font-semibold text-[#b55043]">Unable to save your profile: {error}</p>}</div></section><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#526063]"><CheckCircle2 className="size-4 text-[#2d8d62]" />Your address is used only for delivery matching and account management.</div></div></main>;
}
