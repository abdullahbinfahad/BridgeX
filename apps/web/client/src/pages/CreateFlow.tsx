import PublicLayout from "@/components/bridgex/PublicLayout";
import { BRIDGEX_TERMS_VERSION, LegalAcknowledgement, acknowledgementText } from "@/components/bridgex/LegalAcknowledgement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { normalizePostCategories } from "@shared/bridgeXControls";
import { appendUniqueMedia, preparePostMedia } from "@/lib/fileUpload";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ImagePlus, PackageCheck, Plane, ShieldCheck, TrainFront } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const SERVICE_TYPES = ["Personal item", "Products for family", "Business product", "Item sourcing", "Documents", "Other goods"];
const PRODUCT_CATEGORIES = ["Electronics & accessories", "Mobile phones", "Laptops", "Cameras", "Medicine & health", "Cosmetics & skincare", "Beauty & personal care", "Home appliances", "Home decoration", "Garments & fashion", "Shoes & bags", "Baby & children", "Food & specialty goods", "Books & stationery", "Computer & office", "Mobile & tablets", "Automotive accessories", "Sports & outdoor", "Tools & hardware", "Jewelry & watches", "Pet supplies", "Toys & games", "Other product"];
const QUANTITY_AWARE_ITEMS = ["Mobile phones", "Laptops", "Cameras"];

const isDomesticRoute = (origin: string, destination: string) => Boolean(origin.trim() && destination.trim() && origin.trim().localeCompare(destination.trim(), undefined, { sensitivity: "accent" }) === 0);
const friendlyError = (error: unknown, fallback: string) => {
  const text = error instanceof Error ? error.message : fallback;
  return /row-level security|violates row-level/i.test(text) ? "Restricted account: your account cannot post or respond right now. Contact BridgeX support or an administrator for a review." : text;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const displayLabel = label === "Purchase country" ? "Purchase country / Current Country" : label === "Purchase city" ? "Purchase City / Current City" : label;
  return <label className="grid gap-2"><span className="text-sm font-bold">{displayLabel}</span>{children}</label>;
}

function Notice({ value, failed }: { value: string; failed: boolean }) {
  return value ? <p className={`rounded-xl px-3 py-2 text-sm font-bold ${failed ? "bg-[#f8e8e5] text-[#9b4b3e]" : "bg-[#dff5ea] text-[#176447]"}`}>{value}</p> : null;
}

function Destination({ country, city, address, onChange }: { country: string; city: string; address: string; onChange: (key: "country" | "city" | "address", value: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <Field label="Destination country"><Input required value={country} onChange={event => onChange("country", event.target.value)} placeholder="Any country" /></Field>
    <Field label="Destination city"><Input required value={city} onChange={event => onChange("city", event.target.value)} placeholder="City, district, or area" /></Field>
    <div className="sm:col-span-2"><Field label="Exact delivery address"><Input required value={address} onChange={event => onChange("address", event.target.value)} placeholder="Private until a protected match is selected" /></Field></div>
  </div>;
}

function DomesticRouteNotice({ domestic }: { domestic: boolean }) {
  return <div className={`rounded-2xl border p-4 text-sm leading-6 ${domestic ? "border-[#9bc9ac] bg-[#f1f8f2] text-[#315f41]" : "border-[#d9d7cf] bg-[#faf9f5] text-[#637073]"}`}>
    <strong className="block text-[#176447]">{domestic ? "Domestic route selected" : "Domestic and international routes are supported"}</strong>
    {domestic ? "Your origin and destination are in the same country. Follow applicable local transport and item rules; the same protected matching and private-address process applies." : "Choose the same country for a domestic route or different countries for a cross-border route. Exact addresses remain private until a protected match is selected."}
  </div>;
}

function MediaPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return <div className="grid gap-3">
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-[#b8c8bf] bg-[#f4faf5] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff5ea] text-[#176447]"><ImagePlus className="size-5" /></span>
      <span><span className="block text-sm font-bold">{files.length ? `${files.length} media file${files.length === 1 ? "" : "s"} selected` : "Add photos or a short video"}</span><span className="mt-1 block text-xs leading-5 text-[#71807b]">Select again to add more files. Up to five photos and one short MP4/WebM video are accepted and compressed before upload.</span></span>
      <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={event => { onChange(appendUniqueMedia(files, Array.from(event.target.files ?? []))); event.currentTarget.value = ""; }} />
    </label>
    {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map(file => <span key={`${file.name}:${file.size}:${file.lastModified}`} className="rounded-full bg-[#f0eee7] px-3 py-1 text-xs font-semibold text-[#526063]">{file.type.startsWith("video/") ? "Video" : "Photo"}: {file.name}</span>)}</div>}
  </div>;
}

async function uploadMedia(userId: string, files: File[]) {
  const prepared = await preparePostMedia(files);
  const paths: string[] = [];
  for (const item of prepared) {
    const path = `${userId}/${crypto.randomUUID()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("request-media").upload(path, item.file, { contentType: item.file.type, upsert: false });
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

async function recordAcknowledgement(userId: string, action: "send_request" | "carry_listing", relatedId: string) {
  const { error } = await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: userId, action, terms_version: BRIDGEX_TERMS_VERSION, acknowledgement_text: acknowledgementText(action), related_type: action, related_id: relatedId });
  if (error) throw new Error(error.message);
}

export function CreateRequest() {
  const { user, isAuthenticated } = useAuth();
  const [, go] = useLocation();
  const [media, setMedia] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [acknowledged, setAcknowledged] = useState(false);
  const [form, setForm] = useState({ title: "", serviceType: "Personal item", productCategories: [] as string[], description: "", weight: "", size: "", source: "", budget: "", originCountry: "", purchaseCity: "", destinationCountry: "", destinationCity: "", destinationAddress: "", deliveryDays: "", specialHandling: "None" });
  const domestic = isDomesticRoute(form.originCountry, form.destinationCountry);
  const toggleCategory = (category: string) => setForm(current => ({ ...current, productCategories: normalizePostCategories(current.productCategories.includes(category) ? current.productCategories.filter(item => item !== category) : [...current.productCategories, category]) }));
  const setDestination = (key: "country" | "city" | "address", value: string) => setForm(current => ({ ...current, destinationCountry: key === "country" ? value : current.destinationCountry, destinationCity: key === "city" ? value : current.destinationCity, destinationAddress: key === "address" ? value : current.destinationAddress }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!isAuthenticated || !user) return go("/access");
    const categories = normalizePostCategories(form.productCategories);
    if (!categories.length) return setMessage("Choose at least one product category.");
    if (!acknowledged) return setMessage("Read and accept the Terms & Conditions before publishing.");
    setBusy(true); setFailed(false); setMessage("");
    try {
      const paths = await uploadMedia(user.id, media);
      const { data, error } = await supabase.from("send_requests").insert({ user_id: user.id, title: form.title.trim(), category: form.serviceType, categories, description: form.description.trim(), weight_kg: Number(form.weight), size_description: form.size.trim() || null, product_link: form.source.trim() || null, image_path: paths[0] ?? null, media_paths: paths, purchase_country: form.originCountry.trim(), purchase_city: form.purchaseCity.trim(), destination_country: form.destinationCountry.trim(), destination_district: form.destinationCountry.trim(), destination_city: form.destinationCity.trim(), destination_address: form.destinationAddress.trim(), delivery_required_days: Number(form.deliveryDays), special_handling: form.specialHandling, budget_bdt: Number(form.budget), currency, terms_accepted_at: new Date().toISOString(), terms_version: BRIDGEX_TERMS_VERSION }).select("id").single();
      if (error) throw new Error(error.message);
      await recordAcknowledgement(user.id, "send_request", data.id);
      formElement.reset(); setMedia([]); setAcknowledged(false); setForm({ title: "", serviceType: "Personal item", productCategories: [], description: "", weight: "", size: "", source: "", budget: "", originCountry: "", purchaseCity: "", destinationCountry: "", destinationCity: "", destinationAddress: "", deliveryDays: "", specialHandling: "None" });
      setMessage(`Your ${domestic ? "domestic" : "global"} send request is live. Guests can view it; only signed-in travelers can make offers.`);
    } catch (error) { setFailed(true); setMessage(friendlyError(error, "BridgeX could not publish this send request.")); } finally { setBusy(false); }
  };

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-[920px]">
    <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Back to marketplace</Link>
    <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.38fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Global and domestic sender tool</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">I need to send.</h1><p className="mt-2 text-sm leading-6 text-[#637073]">Send across borders or within your own country. Give accurate route, item, and handling details so suitable travelers or carriers can respond.</p></div><div className="rounded-2xl bg-[#172126] p-4 text-sm text-[#c3d0c9]"><ShieldCheck className="size-5 text-[#91e7bc]" /><p className="mt-3 font-bold text-white">Private address exchange</p><p className="mt-1 text-xs leading-5">Your full address is never public. It is shared only after protected acceptance.</p></div></div>
    <form onSubmit={submit} className="mt-8 rounded-3xl border border-[#172126]/8 bg-white p-6 sm:p-8"><div className="grid gap-5">
      <Field label="What are you sending or requesting?"><Input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="For example: family medication, business samples, or a personal laptop" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="What type of service do you want?"><select value={form.serviceType} onChange={event => setForm({ ...form, serviceType: event.target.value })} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm">{SERVICE_TYPES.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Purchase country"><Input required value={form.originCountry} onChange={event => setForm({ ...form, originCountry: event.target.value })} placeholder="Any country" /></Field><Field label="Purchase city"><Input required value={form.purchaseCity} onChange={event => setForm({ ...form, purchaseCity: event.target.value })} placeholder="City where the item is purchased or collected" /></Field><Field label="Delivery required within (days)"><Input required min="1" max="365" type="number" value={form.deliveryDays} onChange={event => setForm({ ...form, deliveryDays: event.target.value })} /></Field></div>
      <div><span className="text-sm font-bold">Product categories</span><div className="mt-2 grid gap-2 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] p-3 sm:grid-cols-2">{PRODUCT_CATEGORIES.map(category => <label key={category} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.productCategories.includes(category)} onChange={() => toggleCategory(category)} />{category}</label>)}</div></div>
      <Field label="Full item details"><Textarea required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="State the item, condition, quantity, value, purpose, handling needs, packaging, and purchase instructions accurately." className="min-h-32" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Weight (kg)"><Input required inputMode="decimal" value={form.weight} onChange={event => setForm({ ...form, weight: event.target.value })} /></Field><Field label="Size / quantity"><Input required value={form.size} onChange={event => setForm({ ...form, size: event.target.value })} /></Field></div>
      <Field label="Special handling"><select value={form.specialHandling} onChange={event => setForm({ ...form, specialHandling: event.target.value })} className="h-11 rounded-xl border border-[#d9d7cf] bg-[#faf9f5] px-3 text-sm"><option>None</option><option>Fragile</option><option>Temperature-sensitive</option><option>Medication / regulated item</option><option>Keep dry / careful packaging</option><option>Oversized or heavy</option><option>Other — explain in item details</option></select></Field>
      <Field label="Product or supplier link (optional)"><Input type="url" value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} /></Field>
      <MediaPicker files={media} onChange={setMedia} />
      <Destination country={form.destinationCountry} city={form.destinationCity} address={form.destinationAddress} onChange={setDestination} />
      <DomesticRouteNotice domestic={domestic} />
      <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]"><Field label="Currency"><select value={currency} onChange={event => setCurrency(event.target.value)} className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm">{SUPPORTED_CURRENCIES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></Field><Field label={`Maximum budget (${currency})`}><Input required inputMode="decimal" value={form.budget} onChange={event => setForm({ ...form, budget: event.target.value })} /></Field></div>
      <LegalAcknowledgement action="send_request" checked={acknowledged} onCheckedChange={setAcknowledged} />
      <Button disabled={busy} className="h-12 rounded-xl bg-[#172126] font-bold">{busy ? "Publishing send request…" : "Publish send request"}<PackageCheck className="ml-2 size-4" /></Button><Notice value={message} failed={failed} />
    </div></form>
  </div></main></PublicLayout>;
}

export function CreateListing() {
  const { user, isAuthenticated } = useAuth();
  const [, go] = useLocation();
  const [media, setMedia] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [form, setForm] = useState({ originCountry: "", originCity: "", destinationCountry: "", destinationCity: "", destinationAddress: "", departure: "", estimatedDelivery: "", weight: "", price: "", mode: "flight", pricing: "per_kg", airline: "", flight: "", cargoProvider: "", cargoReference: "", notes: "" });
  const domestic = isDomesticRoute(form.originCountry, form.destinationCountry);
  const toggleCategory = (category: string) => setCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  const selectAll = () => setCategories(current => current.length === PRODUCT_CATEGORIES.length ? [] : PRODUCT_CATEGORIES);
  const setDestination = (key: "country" | "city" | "address", value: string) => setForm(current => ({ ...current, destinationCountry: key === "country" ? value : current.destinationCountry, destinationCity: key === "city" ? value : current.destinationCity, destinationAddress: key === "address" ? value : current.destinationAddress }));
  const providerLabel = form.mode === "train" ? "Train operator / provider" : "Cargo company / provider";
  const referenceLabel = form.mode === "train" ? "Train number or service reference" : "Cargo reference";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!isAuthenticated || !user) return go("/access");
    if (!categories.length) return setMessage("Select at least one category you accept to carry.");
    if (!acknowledged) return setMessage("Read and accept the Terms & Conditions before publishing.");
    setBusy(true); setFailed(false); setMessage("");
    try {
      const paths = await uploadMedia(user.id, media);
      const acceptedItemQuantities = Object.fromEntries(QUANTITY_AWARE_ITEMS.filter(item => categories.includes(item) && Number(itemQuantities[item]) > 0).map(item => [item, Number(itemQuantities[item])]));
      const { data, error } = await supabase.from("carry_listings").insert({ user_id: user.id, origin_country: form.originCountry.trim(), origin_city: form.originCity.trim(), destination_country: form.destinationCountry.trim(), destination_district: form.destinationCountry.trim(), destination_city: form.destinationCity.trim(), destination_address: form.destinationAddress.trim(), transport_mode: form.mode, departure_at: new Date(form.departure).toISOString(), estimated_delivery_at: form.estimatedDelivery ? new Date(form.estimatedDelivery).toISOString() : null, available_weight_kg: Number(form.weight), pricing_mode: form.pricing, price_bdt: Number(form.price), currency, accepted_categories: categories, accepted_item_quantities: acceptedItemQuantities, airline_name: form.mode === "flight" ? form.airline.trim() || null : null, flight_number: form.mode === "flight" ? form.flight.trim() || null : null, cargo_provider: form.mode !== "flight" ? form.cargoProvider.trim() || null : null, cargo_reference: form.mode !== "flight" ? form.cargoReference.trim() || null : null, notes: form.notes.trim() || null, media_paths: paths, terms_accepted_at: new Date().toISOString(), terms_version: BRIDGEX_TERMS_VERSION }).select("id").single();
      if (error) throw new Error(error.message);
      await recordAcknowledgement(user.id, "carry_listing", data.id);
      formElement.reset(); setMedia([]); setItemQuantities({}); setAcknowledged(false); setCategories([]); setForm({ originCountry: "", originCity: "", destinationCountry: "", destinationCity: "", destinationAddress: "", departure: "", estimatedDelivery: "", weight: "", price: "", mode: "flight", pricing: "per_kg", airline: "", flight: "", cargoProvider: "", cargoReference: "", notes: "" });
      setMessage(`Your ${domestic ? "domestic" : "global"} ${form.mode === "train" ? "train" : form.mode} carry-space post is live.`);
    } catch (error) { setFailed(true); setMessage(friendlyError(error, "BridgeX could not publish this carry listing.")); } finally { setBusy(false); }
  };

  return <PublicLayout><main className="px-5 py-10 lg:px-8"><div className="mx-auto max-w-[920px]">
    <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Back to marketplace</Link>
    <h1 className="mt-7 font-display text-4xl font-bold">List travel, train, or cargo capacity.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">List capacity for international or domestic routes. Use the same origin and destination country for a local service.</p>
    <form onSubmit={submit} className="mt-8 rounded-3xl border bg-white p-6"><div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Origin country"><Input required value={form.originCountry} onChange={event => setForm({ ...form, originCountry: event.target.value })} placeholder="Any country" /></Field><Field label="Origin city"><Input required value={form.originCity} onChange={event => setForm({ ...form, originCity: event.target.value })} placeholder="City, district, or area" /></Field></div>
      <Destination country={form.destinationCountry} city={form.destinationCity} address={form.destinationAddress} onChange={setDestination} /><DomesticRouteNotice domestic={domestic} />
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Transport"><select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })} className="h-11 rounded-xl border px-3"><option value="flight">Flight / personal carry</option><option value="train">Train</option><option value="cargo">Cargo</option></select></Field><Field label="Departure"><Input required type="datetime-local" value={form.departure} onChange={event => setForm({ ...form, departure: event.target.value })} /></Field><Field label="Estimated delivery"><Input type="datetime-local" value={form.estimatedDelivery} onChange={event => setForm({ ...form, estimatedDelivery: event.target.value })} /></Field></div>
      {form.mode === "flight" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Airline name"><Input value={form.airline} onChange={event => setForm({ ...form, airline: event.target.value })} /></Field><Field label="Flight number"><Input value={form.flight} onChange={event => setForm({ ...form, flight: event.target.value })} /></Field></div> : <div className="grid gap-4 sm:grid-cols-2"><Field label={providerLabel}><Input value={form.cargoProvider} onChange={event => setForm({ ...form, cargoProvider: event.target.value })} /></Field><Field label={referenceLabel}><Input value={form.cargoReference} onChange={event => setForm({ ...form, cargoReference: event.target.value })} /></Field></div>}
      <div><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">Categories you accept to carry</b><Button type="button" onClick={selectAll} size="sm" variant="outline" className="rounded-lg bg-white">{categories.length === PRODUCT_CATEGORIES.length ? "Clear all" : "Select all"}</Button></div><div className="mt-2 grid gap-2 rounded-xl border p-3 sm:grid-cols-2">{PRODUCT_CATEGORIES.map(category => <label key={category} className="text-sm"><input type="checkbox" checked={categories.includes(category)} onChange={() => toggleCategory(category)} /> {category}</label>)}</div>{QUANTITY_AWARE_ITEMS.some(item => categories.includes(item)) && <div className="mt-3 grid gap-3 rounded-xl bg-[#f4faf5] p-4 sm:grid-cols-3"><p className="text-sm font-bold sm:col-span-3">Available quantity for common items</p>{QUANTITY_AWARE_ITEMS.filter(item => categories.includes(item)).map(item => <label key={item} className="grid gap-1 text-xs font-semibold text-[#526063]">{item}<Input type="number" min="1" inputMode="numeric" value={itemQuantities[item] ?? ""} onChange={event => setItemQuantities(current => ({ ...current, [item]: event.target.value }))} placeholder="Optional quantity" /></label>)}</div>}</div>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Capacity (kg)"><Input required value={form.weight} onChange={event => setForm({ ...form, weight: event.target.value })} /></Field><Field label="Currency"><select value={currency} onChange={event => setCurrency(event.target.value)} className="h-11 rounded-xl border border-[#d9d7cf] bg-white px-3 text-sm">{SUPPORTED_CURRENCIES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></Field><Field label={`Price (${currency})`}><Input required value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></Field></div>
      <Field label="Notes"><Textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field><MediaPicker files={media} onChange={setMedia} />
      <LegalAcknowledgement action="carry_listing" checked={acknowledged} onCheckedChange={setAcknowledged} />
      <Button disabled={busy} className="h-12 rounded-xl bg-[#172126]">{busy ? "Publishing…" : "Publish carry space"}{form.mode === "train" ? <TrainFront className="ml-2 size-4" /> : <Plane className="ml-2 size-4" />}</Button><Notice value={message} failed={failed} />
    </div></form>
  </div></main></PublicLayout>;
}
