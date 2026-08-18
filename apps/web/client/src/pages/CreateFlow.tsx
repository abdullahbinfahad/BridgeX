import PublicLayout from "@/components/bridgex/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { compressImageForUpload } from "@/lib/fileUpload";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ImagePlus, PackageCheck, Plane, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-2"><span className="text-sm font-bold">{label}</span>{children}</label>;
}

function GlobalDestinationFields({ country, city, address, setCountry, setCity, setAddress }: { country: string; city: string; address: string; setCountry: (value: string) => void; setCity: (value: string) => void; setAddress: (value: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2"><Field label="Destination country"><Input required value={country} onChange={(event) => setCountry(event.target.value)} className="h-11 rounded-xl" placeholder="China, Bangladesh, or another country" /></Field><Field label="Destination city"><Input required value={city} onChange={(event) => setCity(event.target.value)} className="h-11 rounded-xl" placeholder="City or area" /></Field><div className="sm:col-span-2"><Field label="Exact delivery address (optional at posting)"><Input value={address} onChange={(event) => setAddress(event.target.value)} className="h-11 rounded-xl" placeholder="Share an exact address only after you select a trusted traveler" /></Field></div></div>;
}

function Message({ value, failed }: { value: string; failed: boolean }) {
  return value ? <p className={`rounded-xl px-3 py-2 text-sm font-bold ${failed ? "bg-[#f8e8e5] text-[#9b4b3e]" : "bg-[#dff5ea] text-[#176447]"}`}>{value}</p> : null;
}

export function CreateRequest() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Electronics", description: "", weightKg: "", size: "", link: "", budget: "", purchaseCountry: "China", destinationCountry: "China", destinationCity: "", destinationAddress: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !user) return setLocation("/access");
    setBusy(true);
    setMessage("");
    setFailed(false);

    let imagePath: string | null = null;
    if (image) {
      const prepared = await compressImageForUpload(image);
      if (prepared.size > 5 * 1024 * 1024) {
        setBusy(false);
        setFailed(true);
        setMessage("Image is still larger than 5 MB after compression.");
        return;
      }

      const safeName = prepared.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("request-media").upload(path, prepared, { contentType: prepared.type, upsert: false });
      if (uploadError) {
        setBusy(false);
        setFailed(true);
        setMessage(uploadError.message);
        return;
      }
      imagePath = path;
    }

    const { error } = await supabase.from("send_requests").insert({
      user_id: user.id,
      title: form.title,
      category: form.category,
      description: form.description,
      weight_kg: Number(form.weightKg),
      size_description: form.size || null,
      product_link: form.link || null,
      image_path: imagePath,
      purchase_country: form.purchaseCountry,
      destination_country: form.destinationCountry,
      destination_district: form.destinationCountry,
      destination_city: form.destinationCity,
      destination_address: form.destinationAddress || null,
      budget_bdt: Number(form.budget),
    });

    setBusy(false);
    if (error) {
      setFailed(true);
      setMessage(error.message);
      return;
    }
    setMessage("Your send request is live. Verified travelers can now make offers.");
  };

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-[920px]"><Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Back to marketplace</Link><div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.38fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Sender tool</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Create a send request.</h1><p className="mt-2 text-sm leading-6 text-[#637073]">China-first, global by design: request items from China or any country and match with travelers going anywhere.</p></div><div className="rounded-2xl bg-[#172126] p-4 text-sm text-[#c3d0c9]"><ShieldCheck className="size-5 text-[#91e7bc]" /><p className="mt-3 font-bold text-white">Protected next step</p><p className="mt-1 text-xs leading-5">Choose a traveler and fund escrow only after comparing offers.</p></div></div><form onSubmit={submit} className="mt-8 rounded-3xl border border-[#172126]/8 bg-white p-6 sm:p-8"><div className="grid gap-5"><Field label="What do you need?"><Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-11 rounded-xl" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm"><option>Electronics</option><option>Beauty & care</option><option>Fashion</option><option>Creative tools</option><option>Home & living</option></select></Field><Field label="Purchase country"><Input value={form.purchaseCountry} onChange={(event) => setForm({ ...form, purchaseCountry: event.target.value })} className="h-11 rounded-xl" /></Field></div><Field label="Description"><Textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28 rounded-xl" /></Field><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#b8c8bf] bg-[#f4faf5] p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#dff5ea] text-[#176447]"><ImagePlus className="size-5" /></span><span><span className="block text-sm font-bold">{image ? image.name : "Add product image"}</span><span className="mt-0.5 block text-xs text-[#71807b]">Optional JPG, PNG, or WEBP. Image is compressed before upload.</span></span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label><div className="grid gap-4 sm:grid-cols-2"><Field label="Estimated weight (kg)"><Input required inputMode="decimal" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} className="h-11 rounded-xl" /></Field><Field label="Size / quantity"><Input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} className="h-11 rounded-xl" /></Field></div><Field label="Optional product link"><Input type="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} className="h-11 rounded-xl" /></Field><GlobalDestinationFields country={form.destinationCountry} city={form.destinationCity} address={form.destinationAddress} setCountry={(value) => setForm({ ...form, destinationCountry: value })} setCity={(value) => setForm({ ...form, destinationCity: value })} setAddress={(value) => setForm({ ...form, destinationAddress: value })} /><Field label="Maximum budget (BDT)"><Input required inputMode="decimal" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} className="h-11 rounded-xl" /></Field><Button disabled={busy} className="h-12 rounded-xl bg-[#172126] font-bold">{busy ? "Creating request…" : "Publish send request"}<PackageCheck className="ml-2 size-4" /></Button><Message value={message} failed={failed} /></div></form></div></main></PublicLayout>;
}

export function CreateListing() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState({ originCountry: "China", originCity: "Guangzhou", destinationCountry: "China", destinationCity: "", destinationAddress: "", date: "", weight: "", price: "", mode: "flight" as "flight" | "cargo", pricing: "per_kg" as "per_kg" | "per_item", notes: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !user) return setLocation("/access");
    setBusy(true);
    setMessage("");
    setFailed(false);
    const { error } = await supabase.from("carry_listings").insert({ user_id: user.id, origin_country: form.originCountry, origin_city: form.originCity, destination_country: form.destinationCountry, destination_district: form.destinationCountry, destination_city: form.destinationCity, destination_address: form.destinationAddress || null, transport_mode: form.mode, departure_at: new Date(form.date).toISOString(), available_weight_kg: Number(form.weight), pricing_mode: form.pricing, price_bdt: Number(form.price), notes: form.notes || null });
    setBusy(false);
    if (error) {
      setFailed(true);
      setMessage(error.message);
      return;
    }
    setMessage("Your carry space is published and ready for sender interest.");
  };

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-[920px]"><Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Back to marketplace</Link><div className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Traveler tool</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">List your carry or cargo space.</h1><p className="mt-2 text-sm leading-6 text-[#637073]">Start in China or anywhere else, and make your available luggage or cargo capacity visible to senders worldwide.</p></div><form onSubmit={submit} className="mt-8 rounded-3xl border border-[#172126]/8 bg-white p-6 sm:p-8"><div className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Origin country"><Input value={form.originCountry} onChange={(event) => setForm({ ...form, originCountry: event.target.value })} className="h-11 rounded-xl" /></Field><Field label="Origin city"><Input value={form.originCity} onChange={(event) => setForm({ ...form, originCity: event.target.value })} className="h-11 rounded-xl" /></Field></div><GlobalDestinationFields country={form.destinationCountry} city={form.destinationCity} address={form.destinationAddress} setCountry={(value) => setForm({ ...form, destinationCountry: value })} setCity={(value) => setForm({ ...form, destinationCity: value })} setAddress={(value) => setForm({ ...form, destinationAddress: value })} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Transport mode"><select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as "flight" | "cargo" })} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm"><option value="flight">Flight / personal carry</option><option value="cargo">Cargo</option></select></Field><Field label="Departure or cargo date"><Input required type="datetime-local" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="h-11 rounded-xl" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Available weight (kg)"><Input required inputMode="decimal" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} className="h-11 rounded-xl" /></Field><Field label="Price (BDT)"><Input required inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-11 rounded-xl" /></Field></div><Field label="Pricing method"><select value={form.pricing} onChange={(event) => setForm({ ...form, pricing: event.target.value as "per_kg" | "per_item" })} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm"><option value="per_kg">Per kg</option><option value="per_item">Per item</option></select></Field><Field label="Notes for senders"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-28 rounded-xl" /></Field><Button disabled={busy} className="h-12 rounded-xl bg-[#172126] font-bold">{busy ? "Publishing listing…" : "Publish carry space"}<Plane className="ml-2 size-4" /></Button><Message value={message} failed={failed} /></div></form></div></main></PublicLayout>;
}
