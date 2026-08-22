import { cacheGet, cacheSet } from "./cache";
import { supabase } from "./supabase";
import type { BridgeXProfile, MarketplacePost, NativeNotification } from "../types";

const TERMS_VERSION = "2026-08-21";

const asArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export async function loadMemberProfile(userId: string): Promise<BridgeXProfile | null> {
  const { data, error } = await supabase.from("users").select("id,email,full_name,avatar_path,role,verification_status,onboarding_complete,suspended,restriction_reason,preferred_currency,preferred_language,phone,current_country,current_city,current_address,home_country,home_city,home_address,china_address").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) await cacheSet(`profile:${userId}`, data);
  return data ?? await cacheGet<BridgeXProfile>(`profile:${userId}`);
}

export async function loadMarketplace(kind: "requests" | "carry", page = 0, pageSize = 40): Promise<MarketplacePost[]> {
  const cacheKey = `marketplace:${kind}:${page}`;
  const from = page * pageSize;
  const result = kind === "requests"
    ? await supabase.from("send_requests").select("id,user_id,title,category,categories,description,purchase_country,purchase_city,destination_country,destination_city,weight_kg,size_description,delivery_required_days,special_handling,budget_bdt,currency,media_paths,image_path,status,created_at").eq("status", "open").order("created_at", { ascending: false }).range(from, from + pageSize - 1)
    : await supabase.from("carry_listings").select("id,user_id,origin_country,origin_city,destination_country,destination_city,transport_mode,available_weight_kg,filled_weight_kg,reserved_weight_kg,price_bdt,currency,accepted_categories,accepted_item_quantities,accepted_item_budgets,departure_at,estimated_delivery_at,airline_name,flight_number,cargo_provider,cargo_reference,notes,media_paths,status,created_at").eq("status", "open").order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (result.error) {
    const fallback = await cacheGet<MarketplacePost[]>(cacheKey);
    if (fallback) return fallback;
    throw result.error;
  }
  const rows = result.data ?? [];
  const ownerIds = Array.from(new Set(rows.map((row: any) => row.user_id).filter(Boolean)));
  const [badges, ratings] = await Promise.all([
    ownerIds.length ? supabase.from("bridgex_member_badges").select("id,display_name,is_verified").in("id", ownerIds) : Promise.resolve({ data: [] as any[] }),
    ownerIds.length ? supabase.from("bridgex_member_rating_summaries").select("id,average_rating,review_count").in("id", ownerIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const badgeById = new Map((badges.data ?? []).map((item: any) => [item.id, item]));
  const ratingById = new Map((ratings.data ?? []).map((item: any) => [item.id, item]));
  const posts = rows.map((row: any): MarketplacePost => {
    const badge: any = badgeById.get(row.user_id); const rating: any = ratingById.get(row.user_id);
    const identity = { posterName: badge?.display_name || "BridgeX member", posterVerified: Boolean(badge?.is_verified), posterRating: Number(rating?.average_rating ?? 0), posterReviewCount: Number(rating?.review_count ?? 0) };
    return kind === "requests"
      ? { id: row.id, kind, ownerId: row.user_id, title: row.title, route: `${row.purchase_city || "Origin"}, ${row.purchase_country || ""} → ${row.destination_city || "Destination"}, ${row.destination_country || ""}`, price: Number(row.budget_bdt ?? 0), currency: row.currency || "BDT", weight: `${row.weight_kg ?? 0} kg`, category: row.category, categories: asArray(row.categories), description: row.description, deliveryDays: row.delivery_required_days, size: row.size_description, specialHandling: row.special_handling, createdAt: row.created_at, mediaPaths: Array.from(new Set([row.image_path, ...asArray(row.media_paths)].filter(Boolean))), status: row.status, ...identity }
      : { id: row.id, kind, ownerId: row.user_id, title: `${row.transport_mode === "cargo" ? "Cargo" : row.transport_mode === "train" ? "Train" : "Carry"} space available`, route: `${row.origin_city || "Origin"}, ${row.origin_country || ""} → ${row.destination_city || "Destination"}, ${row.destination_country || ""}`, price: Number(row.price_bdt ?? 0), currency: row.currency || "BDT", weight: `${Math.max(0, Number(row.available_weight_kg ?? 0) - Number(row.filled_weight_kg ?? 0) - Number(row.reserved_weight_kg ?? 0))} kg remaining`, categories: asArray(row.accepted_categories), transportMode: row.transport_mode, departureAt: row.departure_at, estimatedDeliveryAt: row.estimated_delivery_at, acceptedItemQuantities: row.accepted_item_quantities || {}, acceptedItemBudgets: row.accepted_item_budgets || {}, transportProvider: row.airline_name || row.cargo_provider, transportReference: row.flight_number || row.cargo_reference, description: row.notes, createdAt: row.created_at, mediaPaths: asArray(row.media_paths), status: row.status, ...identity };
  });
  await cacheSet(cacheKey, posts);
  return posts;
}

export async function loadCachedMarketplace(kind: "requests" | "carry", page = 0): Promise<MarketplacePost[] | null> {
  return cacheGet<MarketplacePost[]>(`marketplace:${kind}:${page}`);
}

export type NativeMemberReview = { id: string; rating: number; comment: string; created_at: string };

export async function loadNativeMemberReviews(memberId: string): Promise<NativeMemberReview[]> {
  const { data, error } = await supabase
    .from("completed_order_reviews")
    .select("id,rating,comment,created_at")
    .eq("reviewed_user_id", memberId)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).filter((review: any) => typeof review.comment === "string" && review.comment.trim().length > 0) as NativeMemberReview[];
}

export type NativeNotificationPage = { items: NativeNotification[]; nextBefore: string | null; hasMore: boolean };
export type NativeUnreadCounts = { updates: number; messages: number; workspace: number; payments: number; more: number };

export async function loadNotifications(userId: string, before?: string | null, pageSize = 30): Promise<NativeNotificationPage> {
  const base = supabase.from("notifications").select("id,title,body,created_at,read_at,related_id,type,link").eq("user_id", userId).order("created_at", { ascending: false });
  const { data, error } = before ? await base.lt("created_at", before).limit(pageSize + 1) : await base.limit(pageSize + 1);
  if (error) throw error;
  const rows = (data ?? []) as NativeNotification[];
  const items = rows.slice(0, pageSize);
  if (!before) await cacheSet(`notifications:${userId}`, items);
  return { items, nextBefore: items.at(-1)?.created_at ?? null, hasMore: rows.length > pageSize };
}

export async function loadNativeNotificationById(userId: string, notificationId: string): Promise<NativeNotification | null> {
  const { data, error } = await supabase.from("notifications").select("id,title,body,created_at,read_at,related_id,type,link").eq("user_id", userId).eq("id", notificationId).maybeSingle();
  if (error) throw error;
  return data as NativeNotification | null;
}

export async function loadNativeUnreadCounts(): Promise<NativeUnreadCounts> {
  const { data, error } = await supabase.rpc("bridgex_native_unread_counts");
  if (error) throw error;
  const values = (data || {}) as Partial<NativeUnreadCounts>;
  const payments = Number(values.payments || 0);
  return { updates: Number(values.updates || 0), messages: Number(values.messages || 0), workspace: Number(values.workspace || 0), payments, more: Number(values.more || 0) + payments };
}

export async function registerNativePushToken(userId: string, token: string) {
  const { error } = await supabase.from("device_push_tokens").upsert({ user_id: userId, expo_push_token: token, platform: "android", active: true, updated_at: new Date().toISOString() }, { onConflict: "expo_push_token" });
  if (error) throw error;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", userId);
  if (error) throw error;
}

export type NativeNotificationDestination =
  | { route: "messages" }
  | { route: "payments"; filter?: "pending" | "verifying" | "verified" | "received" }
  | { route: "workspace_records"; section: "active_orders" | "requests" | "carry" | "completed" }
  | { route: "workspace" }
  | { route: "profile" }
  | { route: "admin" }
  | { route: "marketplace" };

export function resolveNativeNotificationDestination(notification: NativeNotification): NativeNotificationDestination {
  const link = (notification.link || "").toLowerCase();
  const type = (notification.type || "").toLowerCase();
  if (link.startsWith("/admin") || type.includes("admin_") || type.includes("verification_review")) return { route: "admin" };
  if (link.includes("/payments") || type.startsWith("payment_")) {
    if (type.includes("required") || type.includes("rejected") || type.includes("pending")) return { route: "payments", filter: "pending" };
    if (type.includes("verifying")) return { route: "payments", filter: "verifying" };
    if (type.includes("verified")) return { route: "payments", filter: "verified" };
    if (type.includes("payout") || type.includes("received")) return { route: "payments", filter: "received" };
    return { route: "payments" };
  }
  if (link.includes("/deals") || link.includes("/messages") || type.includes("match_") || type.includes("message") || type.includes("contact_")) return { route: "messages" };
  if (link.includes("/orders") || type.includes("order_") || type.includes("traveler_update")) return { route: "workspace_records", section: "active_orders" };
  if (link.includes("/offers") || type.includes("offer")) return { route: "workspace_records", section: "requests" };
  if (link.includes("/interests") || type.includes("interest")) return { route: "workspace_records", section: "carry" };
  if (link.includes("/profile") || link.includes("/verification") || type.includes("verification") || type.includes("account")) return { route: "profile" };
  if (link.includes("/workspace")) return { route: "workspace" };
  return { route: "marketplace" };
}

async function recordAcknowledgement(userId: string, action: "send_request" | "carry_listing", relatedId: string) {
  const { error } = await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: userId, action, terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and truthful-item requirements.", related_type: action, related_id: relatedId });
  if (error) throw error;
}

export type NativeSendRequestInput = {
  title: string; serviceType: string; categories: string[]; description: string; weightKg: number; size: string; source?: string;
  originCountry: string; purchaseCity: string; destinationCountry: string; destinationCity: string; destinationAddress: string; deliveryDays: number; specialHandling: string;
  budget: number; currency: string; serviceScope: "domestic" | "international"; declaredValue?: number; declarationCurrency?: string; itemPurpose?: string; commercialUse?: boolean; mediaPaths: string[];
};

export async function createNativeSendRequest(userId: string, input: NativeSendRequestInput) {
  const international = input.serviceScope === "international";
  const { data, error } = await supabase.from("send_requests").insert({ user_id: userId, title: input.title.trim(), category: input.serviceType, categories: input.categories, description: input.description.trim(), weight_kg: input.weightKg, size_description: input.size.trim(), product_link: input.source?.trim() || null, image_path: input.mediaPaths[0] || null, media_paths: input.mediaPaths, purchase_country: input.originCountry.trim(), purchase_city: input.purchaseCity.trim(), destination_country: input.destinationCountry.trim(), destination_district: input.destinationCountry.trim(), destination_city: input.destinationCity.trim(), destination_address: input.destinationAddress.trim(), delivery_required_days: input.deliveryDays, special_handling: input.specialHandling, budget_bdt: input.budget, currency: input.currency, service_scope: input.serviceScope, declared_item_value: international ? input.declaredValue : null, declared_item_currency: international ? input.declarationCurrency : null, item_purpose: international ? input.itemPurpose?.trim() : null, declared_commercial_use: international ? Boolean(input.commercialUse) : null, declaration_confirmed_at: international ? new Date().toISOString() : null, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await recordAcknowledgement(userId, "send_request", data.id);
  return data.id as string;
}

export type NativeCarryListingInput = {
  originCountry: string; originCity: string; destinationCountry: string; destinationCity: string; destinationAddress: string; transportMode: "flight" | "train" | "cargo";
  departureAt: string; estimatedDeliveryAt?: string; availableWeightKg: number; pricingMode: "per_kg" | "per_item"; price: number; currency: string;
  categories: string[]; acceptedItemQuantities: Record<string, number>; acceptedItemBudgets: Record<string, number>; airline?: string; flightNumber?: string; provider?: string; reference?: string; notes?: string; mediaPaths: string[];
};

export async function createNativeCarryListing(userId: string, input: NativeCarryListingInput) {
  const flight = input.transportMode === "flight";
  const { data, error } = await supabase.from("carry_listings").insert({ user_id: userId, origin_country: input.originCountry.trim(), origin_city: input.originCity.trim(), destination_country: input.destinationCountry.trim(), destination_district: input.destinationCountry.trim(), destination_city: input.destinationCity.trim(), destination_address: input.destinationAddress.trim(), transport_mode: input.transportMode, departure_at: new Date(input.departureAt).toISOString(), estimated_delivery_at: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt).toISOString() : null, available_weight_kg: input.availableWeightKg, pricing_mode: input.pricingMode, price_bdt: input.price, currency: input.currency, accepted_categories: input.categories, accepted_item_quantities: input.acceptedItemQuantities, accepted_item_budgets: input.acceptedItemBudgets, airline_name: flight ? input.airline?.trim() || null : null, flight_number: flight ? input.flightNumber?.trim() || null : null, cargo_provider: flight ? null : input.provider?.trim() || null, cargo_reference: flight ? null : input.reference?.trim() || null, notes: input.notes?.trim() || null, media_paths: input.mediaPaths, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await recordAcknowledgement(userId, "carry_listing", data.id);
  return data.id as string;
}

export type NativeWorkspace = {
  requests: Array<{ id: string; title: string; status: string; purchase_country: string | null; destination_country: string | null; destination_city: string | null; created_at: string }>;
  listings: Array<{ id: string; origin_country: string | null; origin_city: string | null; destination_country: string | null; destination_city: string | null; status: string; departure_at: string; available_weight_kg: number | null }>;
  orders: Array<{ id: string; match_id: string | null; reference: string; sender_id: string; traveler_id: string; amount_bdt: number | null; currency: string | null; escrow_status: string; fulfillment_status: string; updated_at: string; counterpart_name?: string | null; counterpart_verified?: boolean; counterpart_rating?: number; counterpart_review_count?: number }>;
};

export async function loadNativeWorkspace(userId: string): Promise<NativeWorkspace> {
  const [requests, listings, orders] = await Promise.all([
    supabase.from("send_requests").select("id,title,status,purchase_country,destination_country,destination_city,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("carry_listings").select("id,origin_country,origin_city,destination_country,destination_city,status,departure_at,available_weight_kg").eq("user_id", userId).order("departure_at", { ascending: true }).limit(50),
    supabase.from("orders").select("id,match_id,reference,sender_id,traveler_id,amount_bdt,currency,escrow_status,fulfillment_status,updated_at").or(`sender_id.eq.${userId},traveler_id.eq.${userId}`).order("updated_at", { ascending: false }).limit(50),
  ]);
  const error = requests.error || listings.error || orders.error;
  if (error) throw error;
  const orderRows = orders.data ?? [];
  const memberIds = Array.from(new Set(orderRows.flatMap((order: any) => [order.sender_id, order.traveler_id]).filter(Boolean)));
  const [badges, ratings] = await Promise.all([
    memberIds.length ? supabase.from("bridgex_member_badges").select("id,display_name,is_verified").in("id", memberIds) : Promise.resolve({ data: [] as any[] }),
    memberIds.length ? supabase.from("bridgex_member_rating_summaries").select("id,average_rating,review_count").in("id", memberIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const badgeById = new Map((badges.data ?? []).map((item: any) => [item.id, item]));
  const ratingById = new Map((ratings.data ?? []).map((item: any) => [item.id, item]));
  const enrichedOrders = orderRows.map((order: any) => {
    const counterpartId = order.sender_id === userId ? order.traveler_id : order.sender_id;
    const badge: any = badgeById.get(counterpartId); const rating: any = ratingById.get(counterpartId);
    return { ...order, counterpart_name: badge?.display_name || "BridgeX member", counterpart_verified: Boolean(badge?.is_verified), counterpart_rating: Number(rating?.average_rating ?? 0), counterpart_review_count: Number(rating?.review_count ?? 0) };
  });
  const workspace = { requests: requests.data ?? [], listings: listings.data ?? [], orders: enrichedOrders } as NativeWorkspace;
  await cacheSet(`workspace:${userId}`, workspace);
  return workspace;
}

export async function archiveNativeRequest(requestId: string) {
  const { error } = await supabase.rpc("archive_bridgex_member_request", { p_request_id: requestId });
  if (error) throw error;
}

export type NativeManagedPost = { id: string; kind: "request" | "listing"; status: string; title: string; description: string; origin: string; destination: string; amount: string; currency: string; weight: string; departure: string };

export async function loadNativeManagedPosts(userId: string): Promise<NativeManagedPost[]> {
  const [requests, listings] = await Promise.all([
    supabase.from("send_requests").select("id,status,title,description,purchase_country,destination_country,destination_city,budget_bdt,currency,weight_kg").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("carry_listings").select("id,status,notes,origin_country,origin_city,destination_country,destination_city,price_bdt,currency,available_weight_kg,departure_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (requests.error || listings.error) throw requests.error || listings.error;
  const requestPosts = (requests.data ?? []).map((item: any): NativeManagedPost => ({ id: item.id, kind: "request", status: item.status, title: item.title, description: item.description || "", origin: item.purchase_country || "Origin", destination: [item.destination_city, item.destination_country].filter(Boolean).join(", ") || "Destination", amount: String(item.budget_bdt ?? ""), currency: item.currency || "BDT", weight: String(item.weight_kg ?? ""), departure: "" }));
  const listingPosts = (listings.data ?? []).map((item: any): NativeManagedPost => ({ id: item.id, kind: "listing", status: item.status, title: "Carry space listing", description: item.notes || "", origin: [item.origin_city, item.origin_country].filter(Boolean).join(", ") || "Origin", destination: [item.destination_city, item.destination_country].filter(Boolean).join(", ") || "Destination", amount: String(item.price_bdt ?? ""), currency: item.currency || "BDT", weight: String(item.available_weight_kg ?? ""), departure: item.departure_at || "" }));
  return [...requestPosts, ...listingPosts];
}

export async function updateNativeManagedPost(userId: string, post: NativeManagedPost) {
  const changes = post.kind === "request" ? { title: post.title.trim(), description: post.description.trim(), budget_bdt: Number(post.amount), currency: post.currency, weight_kg: Number(post.weight) } : { notes: post.description.trim() || null, price_bdt: Number(post.amount), currency: post.currency, available_weight_kg: Number(post.weight), departure_at: post.departure ? new Date(post.departure).toISOString() : undefined };
  const table = post.kind === "request" ? "send_requests" : "carry_listings";
  const { error } = await supabase.from(table).update(changes).eq("id", post.id).eq("user_id", userId).eq("status", "open");
  if (error) throw error;
}

export async function deleteNativeManagedPost(userId: string, post: NativeManagedPost) {
  if (post.kind === "request") return archiveNativeRequest(post.id);
  return deleteNativeListing(userId, post.id);
}

export async function deleteNativeListing(userId: string, listingId: string) {
  const { error } = await supabase.from("carry_listings").delete().eq("id", listingId).eq("user_id", userId).eq("status", "open");
  if (error) throw error;
}

export type NativeOwnerResponse = { id: string; kind: "offer" | "interest"; postId: string; postTitle: string; participantId: string; participantName: string; participantVerified: boolean; amount: number; currency: string; status: string; note: string; createdAt: string; details: string };

export async function loadNativeOwnerResponses(userId: string): Promise<NativeOwnerResponse[]> {
  const [requests, listings] = await Promise.all([
    supabase.from("send_requests").select("id,title").eq("user_id", userId).in("status", ["open", "payment_pending"]).limit(100),
    supabase.from("carry_listings").select("id,origin_city,destination_city").eq("user_id", userId).in("status", ["open", "payment_pending"]).limit(100),
  ]);
  if (requests.error || listings.error) throw requests.error || listings.error;
  const requestIds = (requests.data ?? []).map((row: any) => row.id); const listingIds = (listings.data ?? []).map((row: any) => row.id);
  const [offers, interests] = await Promise.all([
    requestIds.length ? supabase.from("offers").select("id,request_id,traveler_id,amount_bdt,currency,estimated_delivery_at,note,status,created_at").in("request_id", requestIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    listingIds.length ? supabase.from("listing_interests").select("id,listing_id,sender_id,total_offer_bdt,currency,weight_kg,categories,item_quantities,delivery_required_by,note,status,created_at").in("listing_id", listingIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  if (offers.error || interests.error) throw offers.error || interests.error;
  const participantIds = Array.from(new Set([...(offers.data ?? []).map((row: any) => row.traveler_id), ...(interests.data ?? []).map((row: any) => row.sender_id)].filter(Boolean)));
  const badges = participantIds.length ? await supabase.from("bridgex_member_badges").select("id,display_name,is_verified").in("id", participantIds) : { data: [], error: null };
  if (badges.error) throw badges.error;
  const badgeById = new Map((badges.data ?? []).map((badge: any) => [badge.id, badge]));
  const requestById = new Map((requests.data ?? []).map((row: any) => [row.id, row.title]));
  const listingById = new Map((listings.data ?? []).map((row: any) => [row.id, `${row.origin_city || "Origin"} → ${row.destination_city || "Destination"}`]));
  return [
    ...(offers.data ?? []).map((row: any): NativeOwnerResponse => { const badge = badgeById.get(row.traveler_id); return { id: row.id, kind: "offer", postId: row.request_id, postTitle: requestById.get(row.request_id) || "Item request", participantId: row.traveler_id, participantName: badge?.display_name || "BridgeX member", participantVerified: Boolean(badge?.is_verified), amount: Number(row.amount_bdt || 0), currency: row.currency || "BDT", status: row.status, note: row.note || "", createdAt: row.created_at, details: row.estimated_delivery_at ? `Estimated delivery ${new Date(row.estimated_delivery_at).toLocaleDateString()}` : "Delivery date not stated" }; }),
    ...(interests.data ?? []).map((row: any): NativeOwnerResponse => { const badge = badgeById.get(row.sender_id); const quantities = Object.entries(row.item_quantities || {}).filter(([, value]) => Number(value) > 0).map(([item, value]) => `${item}: ${value}`).join(" · "); return { id: row.id, kind: "interest", postId: row.listing_id, postTitle: listingById.get(row.listing_id) || "Carry space", participantId: row.sender_id, participantName: badge?.display_name || "BridgeX member", participantVerified: Boolean(badge?.is_verified), amount: Number(row.total_offer_bdt || 0), currency: row.currency || "BDT", status: row.status, note: row.note || "", createdAt: row.created_at, details: `${row.weight_kg || 0} kg${row.categories?.length ? ` · ${row.categories.join(", ")}` : ""}${quantities ? ` · ${quantities}` : ""}` }; }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function startNativeOwnerPayment(kind: NativeOwnerResponse["kind"], responseId: string) {
  const { data, error } = await supabase.rpc("start_bridgex_payment", { p_kind: kind, p_response_id: responseId, p_terms_version: TERMS_VERSION });
  if (error) throw error;
  return data as string;
}

export async function declineNativeOwnerResponse(kind: NativeOwnerResponse["kind"], responseId: string) {
  const table = kind === "offer" ? "offers" : "listing_interests";
  const { error } = await supabase.from(table).update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", responseId).eq("status", "pending");
  if (error) throw error;
}

export async function updateNativeTravelerOrder(orderId: string, fulfillmentStatus: string) {
  const { error } = await supabase.rpc("update_bridgex_traveler_order", { p_order_id: orderId, p_fulfillment_status: fulfillmentStatus });
  if (error) throw error;
}

export async function confirmNativeSenderDelivery(orderId: string) {
  const { error } = await supabase.rpc("confirm_bridgex_sender_delivery", { p_order_id: orderId });
  if (error) throw error;
}

export type NativeDeal = { id: string; match_type: string; sender_id: string; traveler_id: string; status: string; sender_name: string | null; traveler_name: string | null; sender_last_read_at: string | null; traveler_last_read_at: string | null; last_message_body: string | null; last_message_at: string | null; last_message_sender_id: string | null; accepted_at: string };
export type NativeDealMessage = { id: string; match_id: string; sender_id: string; body: string; created_at: string };

export async function loadNativeDeals(userId: string): Promise<NativeDeal[]> {
  const { data, error } = await supabase.from("matches").select("id,match_type,sender_id,traveler_id,status,sender_name,traveler_name,sender_last_read_at,traveler_last_read_at,last_message_body,last_message_at,last_message_sender_id,accepted_at").or(`sender_id.eq.${userId},traveler_id.eq.${userId}`).order("last_message_at", { ascending: false, nullsFirst: false }).order("accepted_at", { ascending: false }).limit(250);
  if (error) throw error;
  const deals = data ?? [];
  await cacheSet(`deals:${userId}`, deals);
  return deals;
}

export async function loadNativeDealMessages(matchId: string): Promise<NativeDealMessage[]> {
  const { data, error } = await supabase.from("match_messages").select("id,match_id,sender_id,body,created_at").eq("match_id", matchId).order("created_at", { ascending: true }).limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function markNativeDealRead(matchId: string) {
  const { error } = await supabase.rpc("mark_bridgex_match_read", { p_match_id: matchId });
  if (error) throw error;
}

export async function sendNativeDealMessage(userId: string, matchId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { data, error } = await supabase.rpc("send_bridgex_match_message", { p_match_id: matchId, p_body: trimmed });
  if (error) throw error;
  return data as string;
}

export async function createNativeOffer(input: { requestId: string; travelerId: string; requestOwnerId: string; requestTitle: string; amount: number; currency: string; estimatedDeliveryAt?: string; note?: string }) {
  const { data, error } = await supabase.from("offers").insert({ request_id: input.requestId, traveler_id: input.travelerId, amount_bdt: input.amount, currency: input.currency, estimated_delivery_at: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt).toISOString() : null, note: input.note?.trim() || null, status: "pending", terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: input.travelerId, action: "offer", terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and offer requirements.", related_type: "offer", related_id: data.id });
  await supabase.from("notifications").insert({ user_id: input.requestOwnerId, actor_id: input.travelerId, type: "offer_received", title: "New offer received", body: `A traveler submitted an offer of ${input.currency} ${input.amount.toLocaleString()} for ${input.requestTitle}.`, link: "/dashboard/offers", related_id: input.requestId });
  return data.id as string;
}

export type NativeInterestListing = { id: string; user_id: string; origin_country: string | null; destination_country: string | null; currency: string | null; accepted_categories: string[] | null; accepted_item_quantities: Record<string, number> | null; accepted_item_budgets: Record<string, number> | null; status: string };
export async function loadNativeInterestListing(listingId: string): Promise<NativeInterestListing | null> {
  const { data, error } = await supabase.from("carry_listings").select("id,user_id,origin_country,destination_country,currency,accepted_categories,accepted_item_quantities,accepted_item_budgets,status").eq("id", listingId).eq("status", "open").maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertNativeListingInterest(input: { listing: NativeInterestListing; senderId: string; categories: string[]; itemQuantities?: Record<string, number>; quantityDescription?: string; weightKg: number; offer: number; deliveryRequiredBy: string; recipientName?: string; phone: string; address: string; city: string; country: string; note?: string; serviceScope: "domestic" | "international"; declaredValue?: number; declarationCurrency?: string; itemPurpose?: string; commercialUse?: boolean }) {
  const { data: existing, error: existingError } = await supabase.from("listing_interests").select("id,status").eq("listing_id", input.listing.id).eq("sender_id", input.senderId).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.status === "accepted") throw new Error("Your interest in this carry space is already accepted. Open Messages to continue the protected deal.");
  const international = input.serviceScope === "international";
  const payload = { listing_id: input.listing.id, sender_id: input.senderId, note: input.note?.trim() || null, status: "pending", categories: input.categories, quantity_description: input.quantityDescription?.trim() || null, item_quantities: input.itemQuantities || {}, weight_kg: input.weightKg, total_offer_bdt: input.offer, currency: input.listing.currency || "BDT", delivery_required_by: input.deliveryRequiredBy, delivery_recipient_name: input.recipientName?.trim() || null, delivery_phone: input.phone.trim(), delivery_address: input.address.trim(), delivery_city: input.city.trim(), delivery_country: input.country.trim(), service_scope: input.serviceScope, declared_item_value: international ? input.declaredValue : null, declared_item_currency: international ? input.declarationCurrency : null, item_purpose: international ? input.itemPurpose?.trim() : null, declared_commercial_use: international ? Boolean(input.commercialUse) : null, declaration_confirmed_at: international ? new Date().toISOString() : null, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION };
  const result = existing ? await supabase.from("listing_interests").update(payload).eq("id", existing.id).select("id").single() : await supabase.from("listing_interests").insert(payload).select("id").single();
  if (result.error) throw result.error;
  await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: input.senderId, action: "listing_interest", terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and truthful-item requirements.", related_type: "listing_interest", related_id: result.data.id });
  await supabase.from("notifications").insert({ user_id: input.listing.user_id, actor_id: input.senderId, type: existing ? "interest_updated" : "interest_received", title: existing ? "Interest updated in your carry space" : "New interest in your carry space", body: `A sender proposed ${input.listing.currency || "BDT"} ${input.offer.toLocaleString()} for ${input.weightKg} kg.`, link: "/dashboard/offers", related_id: input.listing.id });
  return result.data.id as string;
}

export async function updateNativeProfile(userId: string, values: { full_name: string; phone: string; current_country: string; current_city: string; current_address: string; home_country: string; home_city: string; home_address: string; china_address: string; preferred_currency: string; preferred_language: string; avatar_path?: string | null }) {
  const { error } = await supabase.from("users").update({ ...values, onboarding_complete: Boolean(values.full_name.trim() && values.phone.trim() && values.current_country.trim() && values.current_city.trim() && values.current_address.trim()) }).eq("id", userId);
  if (error) throw error;
}

export async function createNativeVerificationSubmission(userId: string, documentType: "national_id" | "passport" | "student_id", storagePath: string, institutionName?: string) {
  const { error } = await supabase.from("verification_submissions").insert({ user_id: userId, document_type: documentType, storage_path: storagePath, institution_name: institutionName?.trim() || null, consent_confirmed: true, status: "pending" });
  if (error) throw error;
}

export async function markNativeVerificationPending(userId: string) {
  const { error } = await supabase.from("users").update({ verification_status: "pending_review" }).eq("id", userId);
  if (error) throw error;
}

export type NativePayment = { id: string; reference: string; response_kind: "offer" | "interest"; amount: number; currency: string; settlement_currency: string | null; settlement_amount: number | null; exchange_rate: number | null; status: string; payment_method: "alipay" | "wechat_pay" | null; payer_reference: string | null; payer_note: string | null; submitted_at: string | null; reviewer_note: string | null; created_at: string };
export type NativeTravelerPayout = { id: string; order_id: string; amount: number; currency: string; payout_status: string; payout_method: string | null; account_holder: string | null; account_reference: string | null; qr_path: string | null; payment_reference: string | null; administrator_note: string | null; paid_at: string | null; received_at: string | null; created_at: string };
export type NativePaymentInstructions = { alipay: string; wechat_pay: string };

export async function loadNativePayments(userId: string) {
  const [paymentResult, payoutResult] = await Promise.all([
    supabase.from("bridgex_payment_proofs").select("id,reference,response_kind,amount,currency,settlement_currency,settlement_amount,exchange_rate,status,payment_method,payer_reference,payer_note,submitted_at,reviewer_note,created_at").eq("payer_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("bridgex_traveler_payouts").select("id,order_id,amount,currency,payout_status,payout_method,account_holder,account_reference,qr_path,payment_reference,administrator_note,paid_at,received_at,created_at").eq("traveler_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);
  const error = paymentResult.error || payoutResult.error;
  if (error) throw error;
  return { payments: paymentResult.data as NativePayment[] ?? [], payouts: payoutResult.data as NativeTravelerPayout[] ?? [] };
}

export async function loadNativePaymentInstructions(): Promise<NativePaymentInstructions> {
  const [alipay, wechat] = await Promise.all([
    supabase.storage.from("payment-instructions").createSignedUrl("alipay-qr.jpg.jpg", 60 * 60),
    supabase.storage.from("payment-instructions").createSignedUrl("wechat-pay-qr.jpg.jpg", 60 * 60),
  ]);
  return { alipay: alipay.data?.signedUrl || "", wechat_pay: wechat.data?.signedUrl || "" };
}

export async function submitNativePaymentProof(input: { paymentId: string; method: "alipay" | "wechat_pay"; proofPath: string; payerReference?: string; payerNote?: string }) {
  const { error } = await supabase.rpc("submit_bridgex_payment_proof", { p_payment_id: input.paymentId, p_payment_method: input.method, p_proof_path: input.proofPath, p_payer_reference: input.payerReference?.trim() || null, p_payer_note: input.payerNote?.trim() || null });
  if (error) throw error;
}

export async function confirmNativePayoutReceived(payoutId: string) {
  const { error } = await supabase.rpc("confirm_bridgex_traveler_payout_received", { p_payout_id: payoutId });
  if (error) throw error;
}

export type NativeAdminMember = { id: string; email: string | null; full_name: string | null; role: string | null; verification_status: string | null; suspended: boolean | null; restriction_reason: string | null; current_country: string | null; current_city: string | null; created_at: string | null };
export async function loadNativeAdminMembers() {
  const { data, error } = await supabase.from("users").select("id,email,full_name,role,verification_status,suspended,restriction_reason,current_country,current_city,created_at").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data as NativeAdminMember[];
}

export async function moderateNativeMember(memberId: string, action: "restrict" | "restore", reason?: string) {
  const { error } = await supabase.rpc("moderate_bridgex_member", { p_user_id: memberId, p_action: action, p_reason: reason?.trim() || null });
  if (error) throw error;
}
