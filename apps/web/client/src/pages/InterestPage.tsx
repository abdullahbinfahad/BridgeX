import { useAuth } from "@/_core/hooks/useAuth";
import PublicLayout from "@/components/bridgex/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const CATEGORIES = ["Electronics & accessories", "Mobile phones", "Laptops", "Cameras", "Medicine & health", "Cosmetics & skincare", "Beauty & personal care", "Home appliances", "Home decoration", "Garments & fashion", "Shoes & bags", "Baby & children", "Food & specialty goods", "Books & stationery", "Computer & office", "Mobile & tablets", "Other product"];
const QUANTITY_AWARE_ITEMS = ["Mobile phones", "Laptops", "Cameras"];
type Listing = { id: string; user_id: string; origin_country: string; origin_city: string; destination_country: string | null; destination_city: string; available_weight_kg: number; departure_at: string; estimated_delivery_at: string | null; price_bdt: number; currency: string; accepted_categories?: string[]; accepted_item_quantities?: Record<string, number> };

export default function InterestPage() {
  const { user, isAuthenticated } = useAuth();
  const [, go] = useLocation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});
  const [weight, setWeight] = useState("");
  const [offer, setOffer] = useState("");
  const [deliveryRequiredBy, setDeliveryRequiredBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [id] = useState(() => new URLSearchParams(window.location.search).get("listing"));

  useEffect(() => {
    if (!id) return void setLoading(false);
    void supabase.from("carry_listings").select("id,user_id,origin_country,origin_city,destination_country,destination_city,available_weight_kg,departure_at,estimated_delivery_at,price_bdt,currency,accepted_categories,accepted_item_quantities").eq("id", id).eq("status", "open").maybeSingle().then(({ data }) => { setListing(data as Listing | null); setLoading(false); });
  }, [id]);

  const currency = listing?.currency || "BDT";
  const availableCategories = listing?.accepted_categories?.length ? listing.accepted_categories : CATEGORIES;
  const toggle = (category: string) => setCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  const selectedQuantityItems = QUANTITY_AWARE_ITEMS.filter(item => categories.includes(item));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !user) return go("/access");
    if (!listing || listing.user_id === user.id) return setMessage("Choose another open carry listing.");
    if (!categories.length || !weight || !offer || !deliveryRequiredBy) return setMessage("Select categories and provide total weight, total offer, and the delivery-required date.");
    const normalizedItemQuantities = Object.fromEntries(selectedQuantityItems.map(item => [item, Number(itemQuantities[item] || 0)]));
    if (Object.values(normalizedItemQuantities).some(quantityValue => quantityValue < 1)) return setMessage("Enter a correct quantity for every selected Mobile phone, Laptop, or Camera item.");
    const payload = { listing_id: listing.id, sender_id: user.id, note: note.trim() || null, status: "pending", categories, quantity_description: quantity.trim() || null, item_quantities: normalizedItemQuantities, weight_kg: Number(weight), total_offer_bdt: Number(offer), currency, delivery_required_by: deliveryRequiredBy };
    const { data: existing, error: existingError } = await supabase.from("listing_interests").select("id,status").eq("listing_id", listing.id).eq("sender_id", user.id).maybeSingle();
    if (existingError) return setMessage(existingError.message);
    if (existing?.status === "accepted") return setMessage("Your interest in this carry space is already accepted. Open Messages to continue the protected deal.");
    const { error } = existing ? await supabase.from("listing_interests").update(payload).eq("id", existing.id) : await supabase.from("listing_interests").insert(payload);
    if (error) return setMessage(error.message);
    await supabase.from("notifications").insert({ user_id: listing.user_id, actor_id: user.id, type: existing ? "interest_updated" : "interest_received", title: existing ? "Interest updated in your carry space" : "New interest in your carry space", body: `A sender proposed ${currency} ${Number(offer).toLocaleString()} for ${weight} kg, needed by ${new Date(`${deliveryRequiredBy}T00:00:00`).toLocaleDateString()}.`, link: "/dashboard/offers", related_id: listing.id });
    setMessage(existing ? "Your interest was updated and the traveler was notified." : "Interest sent. Best wishes for a safe and lawful delivery discussion.");
  };

  return <PublicLayout><main className="px-5 py-10"><div className="mx-auto max-w-3xl"><Link href="/marketplace" className="text-sm font-bold text-[#176447]"><ArrowLeft className="mr-1 inline size-4" />Back to carry space</Link><h1 className="mt-6 font-display text-4xl font-bold">Show interest</h1><p className="mt-2 text-sm">{listing ? `${listing.origin_city}, ${listing.origin_country} → ${listing.destination_city}, ${listing.destination_country ?? "Destination"} · ${listing.available_weight_kg} kg available` : "Loading listing…"}</p>{listing?.estimated_delivery_at && <p className="mt-1 text-sm text-[#637073]">Traveler’s estimated delivery: {new Date(listing.estimated_delivery_at).toLocaleDateString()}</p>}<form onSubmit={submit} className="mt-6 grid gap-5 rounded-3xl bg-white p-6"><div className="rounded-2xl border border-[#e4c984] bg-[#fff9ea] p-4 text-xs leading-5 text-[#6e5624]"><AlertTriangle className="mr-1 inline size-4" />Do not send illegal, restricted, dangerous, or prohibited items. You are responsible for accurate descriptions, applicable customs, airline, carrier, and legal requirements. Do not conceal items or provide false information. Prohibited activity may lead to post removal, account restriction, cancellation, or reports to authorities where required by law.</div><div><b className="text-sm">Items and categories this traveler accepts</b><div className="mt-2 grid gap-2 rounded-xl border p-3 sm:grid-cols-2">{availableCategories.map(category => <label key={category} className="text-sm"><input type="checkbox" checked={categories.includes(category)} onChange={() => toggle(category)} /> {category}</label>)}</div></div>{selectedQuantityItems.length > 0 && <div className="grid gap-3 rounded-2xl bg-[#f4faf5] p-4 sm:grid-cols-3"><p className="text-sm font-bold sm:col-span-3">Exact item quantities</p>{selectedQuantityItems.map(item => <label key={item} className="grid gap-1 text-sm font-bold">{item}<Input required min="1" type="number" inputMode="numeric" value={itemQuantities[item] ?? ""} onChange={event => setItemQuantities(current => ({ ...current, [item]: event.target.value }))} placeholder="Quantity" /></label>)}</div>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Other item quantity / packaging (optional)<Input value={quantity} onChange={event => setQuantity(event.target.value)} placeholder="e.g. 3 boxes" className="mt-2" /></label><label className="text-sm font-bold">Delivery Required Within — Date<Input required type="date" min={new Date().toISOString().slice(0, 10)} value={deliveryRequiredBy} onChange={event => setDeliveryRequiredBy(event.target.value)} className="mt-2" /></label><label className="text-sm font-bold">Total weight (kg)<Input required min="0.01" step="0.01" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} className="mt-2" /></label><label className="text-sm font-bold">Total offer ({currency})<Input required min="0" step="0.01" inputMode="decimal" value={offer} onChange={event => setOffer(event.target.value)} className="mt-2" /></label></div><Textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Describe all selected items and handling needs." /><Button disabled={loading} className="h-11 bg-[#172126]">Send interest</Button>{message && <p className="rounded-xl bg-[#edf8f0] p-3 text-sm font-semibold text-[#176447]">{message}</p>}</form></div></main></PublicLayout>;
}
