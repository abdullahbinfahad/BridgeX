import { useAuth } from "@/_core/hooks/useAuth";
import PublicLayout from "@/components/bridgex/PublicLayout";
import { MemberVerificationBadge } from "@/components/bridgex/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarDays, Clock3, ImageIcon, MapPin, MessageSquareMore, PackageCheck, Pencil, Plane, ShieldCheck, Star, UserRound, Weight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

type PostKind = "request" | "listing";
type PostRecord = Record<string, any> & { id: string; user_id: string; status: string; media_paths?: string[] | null; image_path?: string | null };
type Poster = { display_name: string; is_verified: boolean; average_rating: number; review_count: number };
type MediaItem = { url: string; type: string };

const money = (value: unknown, currency = "BDT") => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
const mediaPaths = (post: PostRecord) => Array.from(new Set([...(Array.isArray(post.media_paths) ? post.media_paths : []), ...(post.image_path ? [post.image_path] : [])]));
const transportLabel = (mode: unknown) => mode === "cargo" ? "Cargo" : mode === "train" ? "Train" : "Flight / personal carry";
const isDomesticRoute = (origin: unknown, destination: unknown) => typeof origin === "string" && typeof destination === "string" && origin.trim().localeCompare(destination.trim(), undefined, { sensitivity: "accent" }) === 0;

export default function PostDetail() {
  const [, params] = useRoute("/post/:kind/:id");
  const kind: PostKind = params?.kind === "listing" ? "listing" : "request";
  const postId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) return;
    let active = true;
    const urls: string[] = [];
    void (async () => {
      setLoading(true);
      setError("");
      const table = kind === "request" ? "send_requests" : "carry_listings";
      const { data, error: postError } = await supabase.from(table).select("*").eq("id", postId).maybeSingle();
      if (!active) return;
      if (postError || !data) {
        setError(postError?.message ?? "This post is unavailable or no longer open.");
        setLoading(false);
        return;
      }

      const row = data as PostRecord;
      setPost(row);
      const [badge, count, rating] = await Promise.all([
        supabase.from("bridgex_member_badges").select("display_name,is_verified").eq("id", row.user_id).maybeSingle(),
        supabase.from(kind === "request" ? "offers" : "listing_interests").select("id", { count: "exact", head: true }).eq(kind === "request" ? "request_id" : "listing_id", postId),
        supabase.from("bridgex_member_rating_summaries").select("average_rating,review_count").eq("id", row.user_id).maybeSingle(),
      ]);
      if (active) {
        const badgeData = badge.data as { display_name: string; is_verified: boolean } | null;
        const ratingData = rating.data as { average_rating: number; review_count: number } | null;
        setPoster(badgeData ? { ...badgeData, average_rating: Number(ratingData?.average_rating ?? 0), review_count: Number(ratingData?.review_count ?? 0) } : null);
        setResponseCount(count.count ?? 0);
      }

      const files = await Promise.all(mediaPaths(row).map(async path => {
        const { data: blob } = await supabase.storage.from("request-media").download(path);
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return { url, type: blob.type };
      }));
      if (active) setMedia(files.filter((file): file is MediaItem => Boolean(file)));
      setLoading(false);
    })();

    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [kind, postId]);

  if (loading) return <PublicLayout><main className="mx-auto max-w-5xl px-5 py-14 text-sm font-semibold text-[#647174]">Loading this live post…</main></PublicLayout>;
  if (error || !post) return <PublicLayout><main className="mx-auto max-w-5xl px-5 py-14"><Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Marketplace</Link><div className="mt-6 rounded-3xl bg-white p-8"><h1 className="font-display text-3xl font-bold">Post unavailable</h1><p className="mt-3 text-sm text-[#647174]">{error || "This post cannot be opened."}</p></div></main></PublicLayout>;

  const request = kind === "request";
  const ownPost = user?.id === post.user_id;
  const title = request ? post.title : `${transportLabel(post.transport_mode)} space available`;
  const route = request ? `${post.purchase_city || "Purchase city"}, ${post.purchase_country} → ${post.destination_city}, ${post.destination_country ?? post.destination_district}` : `${post.origin_city}, ${post.origin_country} → ${post.destination_city}, ${post.destination_country ?? post.destination_district}`;
  const domestic = request ? isDomesticRoute(post.purchase_country, post.destination_country ?? post.destination_district) : isDomesticRoute(post.origin_country, post.destination_country ?? post.destination_district);
  const actionHref = request ? `/offer?request=${post.id}` : `/interest?listing=${post.id}`;
  const categories = Array.isArray(post.categories) ? post.categories : [];
  const acceptedCategories = Array.isArray(post.accepted_categories) ? post.accepted_categories : [];
  const acceptedItemQuantities = post.accepted_item_quantities && typeof post.accepted_item_quantities === "object" ? Object.entries(post.accepted_item_quantities as Record<string, unknown>).filter(([, quantity]) => Number(quantity) > 0) : [];
  const averageRating = Number(poster?.average_rating ?? 0);
  const reviewCount = Number(poster?.review_count ?? 0);

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-5xl">
    <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]"><ArrowLeft className="size-4" />Back to marketplace</Link>
    <div className="mt-7 grid gap-7 lg:grid-cols-[1.15fr_0.85fr]"><section>
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><Badge className={request ? "bg-[#e7f4ea] text-[#176447]" : "bg-[#172126] text-white"}>{request ? "Item request" : "Carry space"}</Badge><span className="rounded-full bg-[#f0eee7] px-2.5 py-1 text-xs font-bold text-[#607073]">{post.status}</span></div>{ownPost && post.status === "open" && <Link href={`/dashboard/manage-posts?edit=${encodeURIComponent(post.id)}`}><Button size="sm" variant="outline" className="rounded-lg bg-white"><Pencil className="mr-1.5 size-3.5" />Edit post</Button></Link>}</div>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.055em] sm:text-5xl">{title}</h1>
      <Link href={`/member/${post.user_id}`} className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#f4faf5] px-3 py-2 hover:bg-[#e9f5ed]"><UserRound className="size-4 text-[#2d8d62]" /><span className="text-sm font-bold">Posted by {poster?.display_name || "BridgeX member"}</span><MemberVerificationBadge verified={Boolean(poster?.is_verified)} /><span className="inline-flex items-center gap-1 text-xs font-bold text-[#795b08]"><Star className="size-3.5 fill-[#f5bd38] text-[#f5bd38]" />{averageRating.toFixed(1)} ({reviewCount})</span></Link>
      <div className="mt-6 grid gap-3 text-sm leading-6 text-[#536164]"><p className="flex gap-2"><Plane className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{route}</p>{domestic && <p className="rounded-xl bg-[#eef8f0] px-3 py-2 text-[#176447]"><strong>Domestic route</strong> · This service stays within one country and follows the same protected BridgeX match and privacy process.</p>}<p className="flex gap-2"><Weight className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{request ? `${post.weight_kg} kg · Size: ${post.size_description || "Not stated"} · Budget ${money(post.budget_bdt, post.currency)}` : `${post.available_weight_kg} kg available · ${money(post.price_bdt, post.currency)} / ${post.pricing_mode === "per_kg" ? "kg" : "item"}`}</p>{request ? <><p className="flex gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Delivery required within: <strong>{post.delivery_required_days ? `${post.delivery_required_days} days` : "Not stated"}</strong></p><p className="flex gap-2"><PackageCheck className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Special handling: <strong>{post.special_handling || "None stated"}</strong></p></> : <><p className="flex gap-2"><Plane className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Transport: <strong>{transportLabel(post.transport_mode)}</strong></p><p className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Departure: <strong>{post.departure_at ? new Date(post.departure_at).toLocaleString() : "Not stated"}</strong></p><p className="flex gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Estimated delivery: <strong>{post.estimated_delivery_at ? new Date(post.estimated_delivery_at).toLocaleString() : "Not stated"}</strong></p></>}<p className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Published {new Date(post.created_at).toLocaleString()}</p>{post.destination_address && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />Exact destination address is protected until a trusted match is selected.</p>}</div>
      <div className="mt-7 rounded-3xl border border-[#172126]/8 bg-white p-6"><h2 className="text-lg font-bold">{request ? "Post details" : "Carry-space details"}</h2>{request && categories.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{categories.map((category: string) => <Badge key={category} className="bg-[#fff4d2] text-[#7b5d09] hover:bg-[#fff4d2]">{category}</Badge>)}</div>}{!request && <><div className="mt-4 grid gap-3 rounded-2xl bg-[#f5f3ed] p-4 text-sm sm:grid-cols-2">{post.airline_name && <p><strong>Airline:</strong> {post.airline_name}</p>}{post.flight_number && <p><strong>Flight number:</strong> {post.flight_number}</p>}{post.cargo_provider && <p><strong>{post.transport_mode === "train" ? "Train operator:" : "Cargo provider:"}</strong> {post.cargo_provider}</p>}{post.cargo_reference && <p><strong>{post.transport_mode === "train" ? "Train number / reference:" : "Cargo reference:"}</strong> {post.cargo_reference}</p>}{!post.airline_name && !post.flight_number && !post.cargo_provider && !post.cargo_reference && <p className="sm:col-span-2 text-[#637073]">No additional transport reference was provided.</p>}</div><div className="mt-5"><p className="text-sm font-bold">Accepted categories</p>{acceptedCategories.length ? <div className="mt-2 flex flex-wrap gap-2">{acceptedCategories.map((category: string) => <Badge key={category} className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{category}</Badge>)}</div> : <p className="mt-2 text-sm text-[#637073]">No category restrictions were stated.</p>}</div>{acceptedItemQuantities.length > 0 && <div className="mt-5"><p className="text-sm font-bold">Available quantities</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{acceptedItemQuantities.map(([item, quantity]) => <div key={item} className="rounded-xl bg-[#f4faf5] px-3 py-2 text-sm"><strong>{item}</strong><span className="ml-2 text-[#176447]">{String(quantity)} available</span></div>)}</div></div>}</>}<p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#526063]">{request ? post.description : post.notes || "No additional notes were provided."}</p>{request && post.product_link && <a href={post.product_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold text-[#176447]">Open product link</a>}</div>
    </section><aside className="space-y-5"><div className="rounded-3xl bg-[#172126] p-6 text-[#f7f5ef]"><ShieldCheck className="size-5 text-[#91e7bc]" />{ownPost ? <><h2 className="mt-5 text-xl font-bold">Your live post</h2><p className="mt-2 text-sm leading-6 text-[#c3d0c9]">{responseCount} {request ? "offer" : "interest"}{responseCount === 1 ? " has" : "s have"} reached this post.</p><Link href="/dashboard/offers"><Button className="mt-5 w-full rounded-xl bg-[#91e7bc] font-bold text-[#172126] hover:bg-[#b7efcc]"><MessageSquareMore className="mr-2 size-4" />{request ? "View offers" : "View interested members"}</Button></Link></> : <><h2 className="mt-5 text-xl font-bold">Ready to respond?</h2><p className="mt-2 text-sm leading-6 text-[#c3d0c9]">{request ? "Make an offer only if you can meet the route, timing, and handling requirements." : "Describe the item truthfully and confirm that it is lawful before you show interest."}</p><Link href={isAuthenticated ? actionHref : "/access"}><Button className="mt-5 w-full rounded-xl bg-[#91e7bc] font-bold text-[#172126] hover:bg-[#b7efcc]">{request ? "Make an offer" : "Show interest"}</Button></Link></>}</div><div className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex items-center gap-2"><PackageCheck className="size-5 text-[#2d8d62]" /><h2 className="font-bold">Safer matching</h2></div><p className="mt-3 text-sm leading-6 text-[#637073]">Review all stated details, compare responses, and use the protected order process only after both members agree.</p></div></aside>
    </div>
    {media.length > 0 && <section className="mt-8"><div className="flex items-center gap-2"><ImageIcon className="size-5 text-[#2d8d62]" /><h2 className="text-xl font-bold">Photos and video ({media.length})</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{media.map((file, index) => <div key={file.url} className="overflow-hidden rounded-3xl border border-[#172126]/8 bg-black">{file.type.startsWith("video/") ? <video src={file.url} controls playsInline className="max-h-[520px] w-full" /> : <img src={file.url} alt={`Media ${index + 1} for ${title}`} className="max-h-[520px] w-full object-contain" />}</div>)}</div></section>}
  </div></main></PublicLayout>;
}
