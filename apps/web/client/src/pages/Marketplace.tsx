import PublicLayout from "@/components/bridgex/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Heart, MapPin, PackageCheck, Plane, Search, Weight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";

type View = "requests" | "flights";
type MarketItem = {
  id: string;
  title: string;
  category: string;
  route: string;
  location: string;
  weight: string;
  budget: string;
  date: string;
  tag: string;
  imageUrl?: string | null;
};

export default function Marketplace() {
  const [view, setView] = useState<View>("requests");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeObjectUrls = useRef<string[]>([]);

  const clearObjectUrls = () => {
    activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrls.current = [];
  };

  const load = async () => {
    setLoading(true);
    setError("");
    clearObjectUrls();

    if (view === "requests") {
      const { data, error: requestError } = await supabase
        .from("send_requests")
        .select("id,title,category,purchase_country,destination_country,destination_district,destination_city,weight_kg,budget_bdt,image_path,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100);

      if (requestError) {
        setError(requestError.message);
      } else {
        const mapped = await Promise.all((data ?? []).map(async (item: any): Promise<MarketItem> => {
          let imageUrl: string | null = null;
          if (item.image_path) {
            const { data: imageBlob, error: imageError } = await supabase.storage
              .from("request-media")
              .download(item.image_path);
            if (!imageError && imageBlob) {
              imageUrl = URL.createObjectURL(imageBlob);
              activeObjectUrls.current.push(imageUrl);
            }
          }

          return {
            id: item.id,
            title: item.title,
            category: item.category,
            route: `${item.purchase_country} → ${item.destination_country ?? item.destination_district}`,
            location: item.destination_city,
            weight: `${item.weight_kg} kg`,
            budget: `৳ ${Number(item.budget_bdt).toLocaleString()}`,
            date: "Open now",
            tag: "Send request",
            imageUrl,
          };
        }));
        setItems(mapped);
      }
    } else {
      const { data, error: listingError } = await supabase
        .from("carry_listings")
        .select("id,origin_country,origin_city,destination_country,destination_district,destination_city,transport_mode,available_weight_kg,price_bdt,pricing_mode,departure_at,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100);

      if (listingError) {
        setError(listingError.message);
      } else {
        setItems((data ?? []).map((item: any): MarketItem => ({
          id: item.id,
          title: `${item.transport_mode === "cargo" ? "Cargo" : "Carry"} space available`,
          category: item.transport_mode,
          route: `${item.origin_city}, ${item.origin_country} → ${item.destination_city}, ${item.destination_country ?? item.destination_district}`,
          location: item.destination_city,
          weight: `${item.available_weight_kg} kg available`,
          budget: `৳ ${Number(item.price_bdt).toLocaleString()} / ${item.pricing_mode === "per_kg" ? "kg" : "item"}`,
          date: new Date(item.departure_at).toLocaleDateString(),
          tag: item.transport_mode === "cargo" ? "Cargo" : "Carry space",
        })));
      }
    }

    setLoading(false);
  };

  useEffect(() => { void load(); }, [view]);
  useEffect(() => () => clearObjectUrls(), []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.title} ${item.route} ${item.location} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const toggleSaved = (id: string) => setSaved((previous) => {
    const next = new Set(previous);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-[1344px]"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d8d62]">China-first global marketplace</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.055em] sm:text-5xl">Find the right carry connection.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#637073]">Explore global item requests and luggage or cargo space. China routes are highlighted, while members can post from anywhere in the world.</p></div><div className="rounded-xl bg-[#e9e5d9] p-1"><button onClick={() => setView("requests")} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === "requests" ? "bg-[#172126] text-white shadow-sm" : "text-[#596466]"}`}>Item requests</button><button onClick={() => setView("flights")} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === "flights" ? "bg-[#172126] text-white shadow-sm" : "text-[#596466]"}`}>Carry space</button></div></div><div className="mt-9 flex h-11 items-center gap-2 rounded-xl border border-[#172126]/8 bg-white px-3"><Search className="size-4 text-[#647174]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item, origin, destination, or route" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" /></div><div className="mt-8 flex items-center justify-between"><p className="text-sm font-semibold text-[#526063]">{loading ? "Loading live posts…" : `${filtered.length} ${view === "requests" ? "requests" : "listings"} found`}</p><Button onClick={load} variant="outline" className="rounded-xl bg-white">Refresh posts</Button></div>{error && <p className="mt-4 rounded-xl bg-[#f8e8e5] px-3 py-2 text-sm font-semibold text-[#9b4b3e]">{error}</p>}<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="group overflow-hidden rounded-3xl border border-[#172126]/8 bg-white">{item.imageUrl && <img src={item.imageUrl} alt={`Photo for ${item.title}`} className="h-44 w-full object-cover" loading="lazy" />}<div className="p-5"><div className="flex items-start justify-between"><Badge className="rounded-full bg-[#e7f4ea] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#23784f] hover:bg-[#e7f4ea]">{item.tag}</Badge><button onClick={() => toggleSaved(item.id)} aria-label="Save listing" className={`grid size-8 place-items-center rounded-full ${saved.has(item.id) ? "bg-[#fdf0d0] text-[#ad7420]" : "text-[#687476]"}`}><Heart className={`size-4 ${saved.has(item.id) ? "fill-current" : ""}`} /></button></div><h2 className="mt-6 text-lg font-bold tracking-[-0.025em]">{item.title}</h2><div className="mt-4 grid gap-2.5 text-sm text-[#5d696c]"><p className="flex items-center gap-2"><Plane className="size-4 text-[#2d8d62]" />{item.route}</p><p className="flex items-center gap-2"><MapPin className="size-4 text-[#2d8d62]" />{item.location}</p><p className="flex items-center gap-2"><Weight className="size-4 text-[#2d8d62]" />{item.weight}</p><p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#2d8d62]" />{item.date}</p></div><div className="mt-5 flex items-center justify-between border-t border-[#172126]/7 pt-4"><div><p className="text-[11px] font-semibold text-[#788481]">{view === "requests" ? "Budget" : "Price"}</p><p className="mt-0.5 font-bold">{item.budget}</p></div><span className="text-xs font-bold text-[#637073]">Pending review</span></div><Link href={view === "requests" ? "/offer" : "/create-request"} className="mt-5 flex"><Button variant="outline" className="h-10 w-full rounded-xl border-[#172126]/12 bg-[#f9f8f5] font-bold">{view === "requests" ? "Make an offer" : "Send interest"}</Button></Link></div></article>)}</div>{!loading && filtered.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-[#172126]/18 bg-white p-12 text-center"><PackageCheck className="mx-auto size-8 text-[#2d8d62]" /><h2 className="mt-4 font-bold">No live posts found</h2><p className="mt-2 text-sm text-[#647174]">Be the first to publish a request or list your carry space.</p></div>}</div></main></PublicLayout>;
}
