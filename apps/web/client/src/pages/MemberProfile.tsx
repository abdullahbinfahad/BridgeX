import PublicLayout from "@/components/bridgex/PublicLayout";
import { MemberVerificationBadge } from "@/components/bridgex/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, MapPin, PackageCheck, Plane, Star, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

type BadgeProfile = { id: string; display_name: string; is_verified: boolean };
type Post = { id: string; kind: "request" | "listing"; title: string; route: string; detail: string };
type Rating = { average_rating: number; review_count: number };
type Review = { id: string; rating: number; comment: string | null; created_at: string };

export default function MemberProfile() {
  const [, params] = useRoute("/member/:id");
  const memberId = params?.id ?? "";
  const [profile, setProfile] = useState<BadgeProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    void (async () => {
      const [badge, requests, listings, summary, feedback] = await Promise.all([
        supabase.from("bridgex_member_badges").select("id,display_name,is_verified").eq("id", memberId).maybeSingle(),
        supabase.from("send_requests").select("id,title,purchase_country,destination_country,destination_city,weight_kg,budget_bdt").eq("user_id", memberId).eq("status", "open").order("created_at", { ascending: false }).limit(40),
        supabase.from("carry_listings").select("id,origin_country,origin_city,destination_country,destination_city,available_weight_kg,price_bdt,pricing_mode").eq("user_id", memberId).eq("status", "open").order("created_at", { ascending: false }).limit(40),
        supabase.from("bridgex_member_rating_summaries").select("average_rating,review_count").eq("id", memberId).maybeSingle(),
        supabase.from("completed_order_reviews").select("id,rating,comment,created_at").eq("reviewed_user_id", memberId).not("comment", "is", null).order("created_at", { ascending: false }).limit(20),
      ]);
      setProfile(badge.data as BadgeProfile | null);
      setRating(summary.data as Rating | null);
      setReviews((feedback.data ?? []) as Review[]);
      setPosts([
        ...(requests.data ?? []).map(item => ({ id: item.id, kind: "request" as const, title: item.title, route: `${item.purchase_country} → ${item.destination_country ?? "Destination"}, ${item.destination_city}`, detail: `${item.weight_kg} kg · Budget ৳ ${Number(item.budget_bdt).toLocaleString()}` })),
        ...(listings.data ?? []).map(item => ({ id: item.id, kind: "listing" as const, title: "Carry space available", route: `${item.origin_city}, ${item.origin_country} → ${item.destination_city}, ${item.destination_country ?? "Destination"}`, detail: `${item.available_weight_kg} kg · ৳ ${Number(item.price_bdt).toLocaleString()}${item.pricing_mode === "per_kg" ? " / kg" : ""}` })),
      ]);
      setLoading(false);
    })();
  }, [memberId]);

  const average = Number(rating?.average_rating ?? 0);
  const count = Number(rating?.review_count ?? 0);

  return <PublicLayout><main className="px-5 py-10 lg:px-8 lg:py-14"><div className="mx-auto max-w-4xl">
    {loading ? <p className="rounded-2xl bg-white p-6 text-sm font-semibold text-[#647174]">Loading member profile…</p> : !profile ? <div className="rounded-3xl bg-white p-8 text-center"><UserRound className="mx-auto size-8 text-[#2d8d62]" /><h1 className="mt-4 text-xl font-bold">Member profile unavailable</h1><Link href="/marketplace"><Button className="mt-5 rounded-xl bg-[#172126]">Browse marketplace</Button></Link></div> : <>
      <section className="relative rounded-3xl border border-[#172126]/8 bg-white p-7 pr-28 sm:pr-40"><Link href={`/report-incident?member=${encodeURIComponent(memberId)}`} className="absolute right-5 top-5"><Button variant="outline" size="sm" className="rounded-xl bg-white text-[#9b4b3e]"><AlertTriangle className="mr-2 size-4" />Report member</Button></Link><div className="flex flex-wrap items-center gap-4"><span className="grid size-16 place-items-center rounded-full bg-[#dff5ea] text-xl font-bold text-[#176447]">{profile.display_name.slice(0, 1).toUpperCase()}</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">BridgeX member</p><div className="mt-2 flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold">{profile.display_name}</h1><MemberVerificationBadge verified={profile.is_verified} /></div><span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#795b08]"><Star className="size-4 fill-[#f5bd38] text-[#f5bd38]" />{average.toFixed(1)} ({count})</span><p className="mt-2 text-sm text-[#637073]">Public posts from this member. Contact, address, documents, and private account data are not shown.</p></div></div></section>
      <section className="mt-8"><div className="flex items-center gap-2"><Star className="size-5 fill-[#f5bd38] text-[#f5bd38]" /><h2 className="font-display text-2xl font-bold">Completed-service reviews</h2></div>{reviews.length > 0 ? <div className="mt-4 grid gap-3">{reviews.map(review => <article key={review.id} className="rounded-2xl bg-white p-5"><p className="font-bold text-[#795b08]">★ {review.rating.toFixed(1)} / 5</p>{review.comment && <p className="mt-2 text-sm leading-6 text-[#526063]">{review.comment}</p>}<p className="mt-2 text-xs text-[#748083]">Completed-order feedback · {new Date(review.created_at).toLocaleDateString()}</p></article>)}</div> : <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-[#647174]">No completed-service reviews yet.</p>}</section>
      <section className="mt-8"><div className="flex items-center gap-2"><PackageCheck className="size-5 text-[#2d8d62]" /><h2 className="font-display text-2xl font-bold">Live posts</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{posts.length ? posts.map(post => <Link key={`${post.kind}-${post.id}`} href={`/post/${post.kind}/${post.id}`} className="rounded-2xl border border-[#172126]/8 bg-white p-5 transition hover:border-[#2d8d62]/35"><Badge className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{post.kind === "request" ? "Item request" : "Carry space"}</Badge><h3 className="mt-4 font-bold">{post.title}</h3><p className="mt-2 flex gap-1.5 text-sm text-[#657275]"><Plane className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{post.route}</p><p className="mt-2 flex gap-1.5 text-sm text-[#657275]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{post.detail}</p></Link>) : <p className="rounded-2xl bg-white p-7 text-sm text-[#647174]">This member has no currently public posts.</p>}</div></section>
    </>}
  </div></main></PublicLayout>;
}
