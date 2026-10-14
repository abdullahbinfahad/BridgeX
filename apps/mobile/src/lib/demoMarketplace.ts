import type { MarketplacePost, MarketplaceTab } from "../types";

const requestRoutes = [
  ["Shanghai", "China", "Dhaka", "Bangladesh"], ["Shenzhen", "China", "Chittagong", "Bangladesh"], ["Guangzhou", "China", "Sylhet", "Bangladesh"],
  ["Beijing", "China", "Lahore", "Pakistan"], ["Chengdu", "China", "Kathmandu", "Nepal"], ["Hangzhou", "China", "Colombo", "Sri Lanka"],
  ["Nanjing", "China", "Kuala Lumpur", "Malaysia"], ["Wuhan", "China", "Seoul", "South Korea"], ["Kunming", "China", "Yangon", "Myanmar"], ["Xiamen", "China", "Dubai", "UAE"],
] as const;
const carryRoutes = [
  ["Dhaka", "Bangladesh", "Dubai", "UAE"], ["Beijing", "China", "Guangzhou", "China"], ["Shenzhen", "China", "Dhaka", "Bangladesh"],
  ["Paris", "France", "Madrid", "Spain"], ["Tokyo", "Japan", "Osaka", "Japan"], ["Toronto", "Canada", "London", "UK"],
  ["Istanbul", "Türkiye", "Berlin", "Germany"], ["Kuala Lumpur", "Malaysia", "Singapore", "Singapore"], ["Madrid", "Spain", "Barcelona", "Spain"], ["New York", "USA", "Mexico City", "Mexico"],
] as const;
const products = ["Smart watch", "Tablet case", "Cotton shirt", "Kitchen blender", "Sketchbook", "Vitamin organizer", "LED lamp", "Travel adapter", "Perfume set", "Baby clothes"];
const categories = ["Electronics", "Garments & footwear", "Home appliances", "Books & stationery", "Beauty", "Personal item", "Home decoration", "Business product", "Products for family", "Other goods"];
const image = (query: string, index: number) => `https://loremflickr.com/900/600/${encodeURIComponent(query)}?lock=${index + 1}`;
const requestImageQuery = (title: string) => /watch|headphone|charger|adapter|tablet/i.test(title) ? "electronics,product" : /skin|beauty|perfume|vitamin/i.test(title) ? "cosmetics,beauty" : /tea|food|grocery/i.test(title) ? "tea,groceries" : /shoe|shirt|garment|clothes/i.test(title) ? "clothing,fashion" : /book|sketch|document|stationery/i.test(title) ? "books,stationery" : /camera|photography/i.test(title) ? "camera,photography" : /blender|appliance|kitchen/i.test(title) ? "kitchen,appliance" : /lamp|decor|ceramic/i.test(title) ? "home,decoration" : "parcel,shopping";
const carryImageQuery = (mode: string) => mode === "flight" ? "airplane,luggage" : mode === "train" ? "train,travel" : "cargo,freight";

const demoMember = (index: number) => ({ name: `Demo member ${String((index % 10) + 1).padStart(2, "0")}`, id: `demo-member-${index + 1}` });
const base = (id: string, kind: MarketplaceTab, title: string, route: string, price: number, weight: string, category: string, media: string, index: number): MarketplacePost => {
  const member = demoMember(index);
  return { id, kind, ownerId: member.id, title, route, price, currency: "BDT", weight, category, categories: [category], description: "Demo preview only. This listing is not a live member post and cannot be opened or acted on.", deliveryDays: 7 + (index % 24), size: index % 2 ? "Small box" : "Fragile", specialHandling: index % 3 ? "None" : "Keep dry", posterName: member.name, posterVerified: false, posterRating: 0, posterReviewCount: 0, createdAt: new Date(Date.now() - index * 60_000).toISOString(), mediaPaths: [image(media, index)], status: "demo_preview" };
};

export const NATIVE_DEMO_REQUESTS: MarketplacePost[] = Array.from({ length: 110 }, (_, index) => {
  const [from, fromCountry, to, toCountry] = requestRoutes[index % requestRoutes.length];
  const product = `${products[index % products.length]} ${index + 1}`;
  return base(`demo-request-${String(index + 1).padStart(3, "0")}`, "requests", product, `${from}, ${fromCountry} → ${to}, ${toCountry}`, 350 + index * 85, `${(0.3 + (index % 8) * 0.4).toFixed(1)} kg`, categories[index % categories.length], requestImageQuery(product), index);
});

export const NATIVE_DEMO_CARRY: MarketplacePost[] = Array.from({ length: 110 }, (_, index) => {
  const [from, fromCountry, to, toCountry] = carryRoutes[index % carryRoutes.length];
  const mode = (["flight", "train", "cargo"] as const)[index % 3];
  return base(`demo-carry-${String(index + 1).padStart(3, "0")}`, "carry", `${mode === "flight" ? "Flight" : mode === "train" ? "Train" : "Cargo"} carry space ${index + 1}`, `${from}, ${fromCountry} → ${to}, ${toCountry}`, 90 + (index % 8) * 55, `${4 + (index % 70)} kg remaining`, mode, carryImageQuery(mode), index + 200);
});

export function nativeDemoPosts(tab: MarketplaceTab) {
  return tab === "requests" ? NATIVE_DEMO_REQUESTS : NATIVE_DEMO_CARRY;
}
