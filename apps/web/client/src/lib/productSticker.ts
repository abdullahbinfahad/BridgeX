export type ProductSticker = {
  emoji: string;
  label: string;
  tone: string;
};

const STICKERS: Array<{ match: RegExp; sticker: ProductSticker }> = [
  { match: /mobile|phone|smartphone|iphone|android/i, sticker: { emoji: "📱", label: "Mobile device", tone: "from-sky-100/90 to-blue-100/60" } },
  { match: /laptop|computer|tablet|electronics?|camera|device/i, sticker: { emoji: "💻", label: "Electronics", tone: "from-indigo-100/90 to-sky-100/60" } },
  { match: /medicine|medical|health|pharmacy|drug/i, sticker: { emoji: "💊", label: "Medicine", tone: "from-rose-100/90 to-red-100/60" } },
  { match: /cosmetic|makeup|beauty|skincare|perfume/i, sticker: { emoji: "💄", label: "Beauty", tone: "from-pink-100/90 to-fuchsia-100/60" } },
  { match: /garment|clothing|fashion|shirt|dress|shoe|shoes|textile/i, sticker: { emoji: "👕", label: "Garments", tone: "from-violet-100/90 to-purple-100/60" } },
  { match: /food|grocery|snack|fruit|drink|beverage/i, sticker: { emoji: "🍱", label: "Food", tone: "from-orange-100/90 to-amber-100/60" } },
  { match: /document|passport|certificate|paper|file/i, sticker: { emoji: "📄", label: "Documents", tone: "from-slate-100/90 to-gray-100/60" } },
  { match: /home|appliance|furniture|decoration|kitchen/i, sticker: { emoji: "🏠", label: "Home goods", tone: "from-emerald-100/90 to-green-100/60" } },
  { match: /personal|family|gift|other goods|item/i, sticker: { emoji: "🎁", label: "Personal item", tone: "from-yellow-100/90 to-orange-100/60" } },
  { match: /cargo|freight|carry|space|luggage|travel/i, sticker: { emoji: "🧳", label: "Carry space", tone: "from-teal-100/90 to-cyan-100/60" } },
];

export function productSticker(...values: Array<string | null | undefined>): ProductSticker {
  const haystack = values.filter(Boolean).join(" ");
  return STICKERS.find(({ match }) => match.test(haystack))?.sticker ?? { emoji: "📦", label: "Goods", tone: "from-amber-100/90 to-yellow-100/60" };
}
