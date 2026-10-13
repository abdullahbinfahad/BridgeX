export type DemoMarketItem = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  productCategories: string[];
  route: string;
  weight: string;
  budget: string;
  date: string;
  tag: string;
  previewUrl: string;
  previewType: "image";
  mediaCount: number;
  posterName: string;
  posterVerified: boolean;
  posterRating: { average: number; count: number };
  requestInfo?: { purchaseCity: string; destinationCity: string; days: number | null; size: string; handling: string };
  remainingItems?: string;
  isDemo: true;
};

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=72`;
const people = [
  ["Mina Rahman", true, 4.9, 18], ["Daniel Wu", false, 4.7, 9], ["Sofia Martinez", true, 5, 6], ["Arif Hossain", false, 4.8, 12], ["Emma Johnson", true, 4.6, 4],
] as const;
const requestRows = [
  ["demo-request-01", "Hand Watch", "Electronics & accessories", "Personal item", "Nanjing, China → Lahore, Pakistan", "0.2 kg", "৳ 300", "20 days", "5 cm", "Fragile", "photo-1523170335258-f5ed11844a49"],
  ["demo-request-02", "Family Skincare Set", "Beauty", "Products for family", "Guangzhou, China → Dhaka, Bangladesh", "1.4 kg", "৳ 1,200", "14 days", "Small box", "Keep dry", "photo-1556229010-6c3f2c9c8f31"],
  ["demo-request-03", "Wireless Headphones", "Electronics", "Personal item", "Shenzhen, China → Chittagong, Bangladesh", "0.6 kg", "৳ 850", "18 days", "20 × 18 cm", "None", "photo-1505740420928-5e560c06d30e"],
  ["demo-request-04", "Ceramic Tea Set", "Home decoration", "Products for family", "Shanghai, China → Sylhet, Bangladesh", "2.8 kg", "৳ 1,600", "21 days", "Medium box", "Fragile", "photo-1547592180-85f173990554"],
  ["demo-request-05", "Children's Story Books", "Books & stationery", "Products for family", "Beijing, China → Rajshahi, Bangladesh", "2 kg", "৳ 700", "30 days", "30 × 22 cm", "Keep dry", "photo-1544947950-fa07a98d237f"],
  ["demo-request-06", "Running Shoes", "Garments & footwear", "Personal item", "Chengdu, China → Kathmandu, Nepal", "1.1 kg", "৳ 1,000", "15 days", "Shoe box", "None", "photo-1542291026-7eec264c27ff"],
  ["demo-request-07", "Laptop Charger", "Computer accessories", "Business product", "Hangzhou, China → Colombo, Sri Lanka", "0.5 kg", "৳ 550", "12 days", "Small parcel", "None", "photo-1588872657578-7efd1f1555ed"],
  ["demo-request-08", "Herbal Tea Pack", "Food & groceries", "Products for family", "Kunming, China → Yangon, Myanmar", "1 kg", "৳ 450", "16 days", "Small parcel", "Keep dry", "photo-1544787219-7f47ccb76574"],
  ["demo-request-09", "Camera Lens", "Photography", "Business product", "Wuhan, China → Kuala Lumpur, Malaysia", "0.8 kg", "৳ 2,500", "10 days", "12 cm", "Fragile", "photo-1516035069371-29a1b244cc32"],
  ["demo-request-10", "Office Documents", "Documents", "Documents", "Suzhou, China → Seoul, South Korea", "0.3 kg", "৳ 400", "7 days", "A4 envelope", "Keep dry", "photo-1455390582262-044cdead277a"],
] as const;
const carryRows = [
  ["demo-carry-01", "Flight carry space", "flight", "12 kg remaining", "৳ 420 / kg", "Oct 28, 2026", "Dhaka, Bangladesh → Dubai, UAE", "photo-1436491865332-7a61a109cc05"],
  ["demo-carry-02", "Train carry space", "train", "8 kg remaining", "৳ 180 / kg", "Nov 02, 2026", "Beijing, China → Guangzhou, China", "photo-1474487548417-781cb71495f3"],
  ["demo-carry-03", "Cargo capacity", "cargo", "60 kg remaining", "৳ 95 / kg", "Nov 08, 2026", "Shenzhen, China → Dhaka, Bangladesh", "photo-1586528116311-ad8dd3c8310d"],
  ["demo-carry-04", "Flight carry space", "flight", "5 kg remaining", "৳ 600 / kg", "Oct 30, 2026", "Paris, France → Madrid, Spain", "photo-1507525428034-b723cf961d3e"],
  ["demo-carry-05", "Train carry space", "train", "15 kg remaining", "৳ 210 / kg", "Nov 11, 2026", "Tokyo, Japan → Osaka, Japan", "photo-1513475382585-d06e58bcb0e0"],
  ["demo-carry-06", "Flight carry space", "flight", "9 kg remaining", "৳ 350 / kg", "Nov 04, 2026", "Toronto, Canada → London, UK", "photo-1519167758481-83f550bb49b3"],
  ["demo-carry-07", "Cargo capacity", "cargo", "120 kg remaining", "৳ 70 / kg", "Nov 20, 2026", "Istanbul, Türkiye → Berlin, Germany", "photo-1565610222536-ef125c59da2e"],
  ["demo-carry-08", "Flight carry space", "flight", "4 kg remaining", "৳ 500 / kg", "Oct 26, 2026", "Kuala Lumpur, Malaysia → Singapore", "photo-1436491865332-7a61a109cc05"],
  ["demo-carry-09", "Train carry space", "train", "10 kg remaining", "৳ 160 / kg", "Nov 15, 2026", "Madrid, Spain → Barcelona, Spain", "photo-1474487548417-781cb71495f3"],
  ["demo-carry-10", "Cargo capacity", "cargo", "40 kg remaining", "৳ 110 / kg", "Nov 23, 2026", "New York, USA → Mexico City, Mexico", "photo-1586528116311-ad8dd3c8310d"],
] as const;

export const DEMO_REQUESTS: DemoMarketItem[] = requestRows.map((row, index) => {
  const person = people[index % people.length];
  return { id: row[0], ownerId: `demo-member-${index + 1}`, title: row[1], category: row[2], productCategories: [row[2]], route: row[4], weight: row[5], budget: row[6], date: "Demo preview", tag: "Item request · Demo", previewUrl: image(row[10]), previewType: "image", mediaCount: 1, posterName: person[0], posterVerified: person[1], posterRating: { average: person[2], count: person[3] }, requestInfo: { purchaseCity: row[4].split(" → ")[0], destinationCity: row[4].split(" → ")[1], days: Number(row[7].split(" ")[0]), size: row[8], handling: row[9] }, isDemo: true };
});
export const DEMO_CARRY: DemoMarketItem[] = carryRows.map((row, index) => { const person = people[(index + 2) % people.length]; return { id: row[0], ownerId: `demo-carrier-${index + 1}`, title: row[1], category: row[2], productCategories: [], route: row[6], weight: row[3], budget: row[4], date: row[5], tag: `${row[2]} · Demo`, previewUrl: image(row[7]), previewType: "image", mediaCount: 1, posterName: person[0], posterVerified: person[1], posterRating: { average: person[2], count: person[3] }, remainingItems: "mobile · laptop · camera", isDemo: true }; });
