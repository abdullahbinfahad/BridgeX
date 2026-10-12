export type ProductSticker = {
  emoji: string;
  label: string;
  tone: string;
};

type StickerRule = [pattern: string, emoji: string, label: string, tone: string];
const tones = {
  sky: "from-sky-100/70 to-blue-100/40", blue: "from-blue-100/70 to-indigo-100/40", violet: "from-violet-100/70 to-purple-100/40",
  pink: "from-pink-100/70 to-fuchsia-100/40", rose: "from-rose-100/70 to-red-100/40", orange: "from-orange-100/70 to-amber-100/40",
  yellow: "from-yellow-100/70 to-orange-100/40", green: "from-emerald-100/70 to-green-100/40", teal: "from-teal-100/70 to-cyan-100/40",
  slate: "from-slate-100/70 to-gray-100/40",
};

// Specific rules come first; the fallback rules at the end cover broad categories.
const rules: StickerRule[] = [
  ["watch|wristwatch|smart watch", "⌚", "Watch", tones.sky], ["phone|mobile|iphone|android|smartphone", "📱", "Mobile phone", tones.sky],
  ["laptop|macbook|notebook|chromebook", "💻", "Laptop", tones.blue], ["tablet|ipad", "📲", "Tablet", tones.blue],
  ["desktop|computer|pc|monitor|screen", "🖥️", "Computer", tones.blue], ["keyboard", "⌨️", "Keyboard", tones.slate],
  ["mouse", "🖱️", "Computer mouse", tones.slate], ["printer|scanner", "🖨️", "Printer", tones.slate], ["camera|dslr|gopro", "📷", "Camera", tones.violet],
  ["video camera|camcorder", "📹", "Video camera", tones.violet], ["headphone|earphone|airpod", "🎧", "Headphones", tones.violet],
  ["speaker|audio|sound", "🔊", "Audio", tones.violet], ["microphone|mic", "🎙️", "Microphone", tones.violet], ["television|tv", "📺", "Television", tones.blue],
  ["game|console|playstation|xbox|nintendo", "🎮", "Game console", tones.violet], ["controller", "🕹️", "Game controller", tones.violet],
  ["smartwatch|fitness band", "⌚", "Wearable", tones.sky], ["charger|cable|adapter", "🔌", "Charger", tones.yellow], ["battery|power bank", "🔋", "Battery", tones.green],
  ["drone", "🚁", "Drone", tones.sky], ["projector", "📽️", "Projector", tones.blue], ["calculator", "🧮", "Calculator", tones.slate],
  ["medicine|tablet medicine|pill|pharmacy|drug", "💊", "Medicine", tones.rose], ["vitamin|supplement", "🧴", "Health supplement", tones.green],
  ["first aid|medical kit", "🩹", "First aid", tones.rose], ["thermometer", "🌡️", "Thermometer", tones.rose], ["mask", "😷", "Safety mask", tones.rose],
  ["toothbrush|toothpaste", "🪥", "Dental care", tones.sky], ["soap|shampoo|body wash", "🧼", "Personal care", tones.sky], ["cosmetic|makeup", "💄", "Cosmetics", tones.pink],
  ["skincare|cream|lotion", "🧴", "Skincare", tones.pink], ["perfume|fragrance", "🧴", "Fragrance", tones.pink], ["lipstick", "💋", "Lipstick", tones.pink],
  ["nail|manicure", "💅", "Nail care", tones.pink], ["mirror", "🪞", "Mirror", tones.pink], ["hair|comb|brush", "💇", "Hair care", tones.pink],
  ["shirt|t-shirt|tshirt|top", "👕", "Shirt", tones.violet], ["dress|skirt|gown", "👗", "Dress", tones.violet], ["jacket|coat", "🧥", "Outerwear", tones.violet],
  ["pants|trouser|jeans", "👖", "Trousers", tones.violet], ["shoe|sneaker|footwear", "👟", "Shoes", tones.violet], ["boot", "🥾", "Boots", tones.violet],
  ["sandal|slipper", "👡", "Sandals", tones.violet], ["hat|cap", "🧢", "Headwear", tones.yellow], ["scarf", "🧣", "Scarf", tones.rose],
  ["glove", "🧤", "Gloves", tones.rose], ["sock", "🧦", "Socks", tones.violet], ["bag|handbag|purse", "👜", "Bag", tones.pink],
  ["backpack", "🎒", "Backpack", tones.blue], ["wallet", "👛", "Wallet", tones.pink], ["jewelry|jewellery|necklace", "💎", "Jewelry", tones.sky],
  ["ring", "💍", "Ring", tones.sky], ["umbrella", "☂️", "Umbrella", tones.blue], ["sunglasses|eyeglasses|glasses", "🕶️", "Eyewear", tones.sky],
  ["food|meal|lunch|dinner", "🍱", "Meal", tones.orange], ["rice", "🍚", "Rice", tones.orange], ["noodle|pasta", "🍜", "Noodles", tones.orange],
  ["bread|bakery", "🍞", "Bakery", tones.yellow], ["cake|dessert", "🍰", "Dessert", tones.pink], ["chocolate|candy", "🍫", "Sweets", tones.rose],
  ["coffee|tea", "☕", "Tea or coffee", tones.orange], ["drink|juice|beverage", "🧃", "Beverage", tones.orange], ["water bottle|bottle", "🧴", "Bottle", tones.sky],
  ["fruit|apple|orange|banana", "🍎", "Fruit", tones.green], ["vegetable|grocery", "🥦", "Groceries", tones.green], ["spice|masala", "🌶️", "Spices", tones.rose],
  ["snack|chips", "🍿", "Snacks", tones.yellow], ["baby food|infant", "🍼", "Baby food", tones.sky], ["document|paper|file", "📄", "Document", tones.slate],
  ["passport|visa", "🛂", "Travel document", tones.blue], ["certificate|diploma", "📜", "Certificate", tones.yellow], ["book|novel|textbook", "📚", "Books", tones.violet],
  ["notebook|journal", "📓", "Notebook", tones.blue], ["pen|pencil|stationery", "✏️", "Stationery", tones.yellow], ["map", "🗺️", "Map", tones.green],
  ["home appliance|appliance", "🏠", "Home appliance", tones.green], ["refrigerator|fridge", "🧊", "Refrigerator", tones.sky], ["washing machine", "🧺", "Laundry appliance", tones.blue],
  ["microwave|oven", "🍳", "Kitchen appliance", tones.orange], ["blender|mixer", "🥤", "Kitchen blender", tones.orange], ["kettle", "🫖", "Kettle", tones.orange],
  ["furniture|chair|table|desk", "🪑", "Furniture", tones.green], ["bed|mattress|pillow", "🛏️", "Bedroom goods", tones.violet], ["lamp|light", "💡", "Lighting", tones.yellow],
  ["decoration|decor|ornament", "🪴", "Home decoration", tones.green], ["plant|flower", "🌿", "Plant", tones.green], ["tool|hardware", "🛠️", "Tools", tones.orange],
  ["bicycle|bike", "🚲", "Bicycle", tones.green], ["motorcycle|motorbike", "🏍️", "Motorcycle", tones.blue], ["car part|automotive", "🔧", "Auto parts", tones.slate],
  ["toy|doll", "🧸", "Toy", tones.yellow], ["puzzle|board game", "🧩", "Game", tones.violet], ["football|soccer", "⚽", "Football", tones.green],
  ["basketball", "🏀", "Basketball", tones.orange], ["cricket", "🏏", "Cricket", tones.green], ["sports|fitness|gym", "🏋️", "Sports", tones.orange],
  ["guitar|instrument|music", "🎸", "Musical instrument", tones.violet], ["piano", "🎹", "Piano", tones.violet], ["art|painting|craft", "🎨", "Art supplies", tones.pink],
  ["pet|cat|dog", "🐾", "Pet supplies", tones.orange], ["religious|prayer", "🕌", "Religious item", tones.green], ["gift|present", "🎁", "Gift", tones.yellow],
  ["watch strap|watch band", "⌚", "Watch accessory", tones.sky], ["router|wifi|modem", "📡", "Network device", tones.blue], ["usb|memory card|flash drive", "💾", "Data storage", tones.blue],
  ["hard drive|ssd", "🗄️", "Storage drive", tones.slate], ["remote control", "🎛️", "Remote control", tones.slate], ["smart home|alexa", "🏡", "Smart home", tones.green],
  ["air conditioner|ac", "❄️", "Air conditioner", tones.sky], ["fan", "🌀", "Fan", tones.sky], ["vacuum", "🧹", "Cleaning appliance", tones.green],
  ["iron|clothes iron", "♨️", "Clothes iron", tones.orange], ["sewing|sewing machine", "🧵", "Sewing", tones.violet], ["fabric|cloth", "🧶", "Fabric", tones.violet],
  ["towel|linen", "🧻", "Household linen", tones.sky], ["curtain|blind", "🪟", "Curtains", tones.blue], ["carpet|rug", "🟫", "Carpet", tones.orange],
  ["plate|dish|bowl", "🍽️", "Tableware", tones.orange], ["cup|mug", "🍵", "Cups", tones.orange], ["spoon|fork|knife", "🍴", "Cutlery", tones.slate],
  ["pan|pot|cookware", "🍳", "Cookware", tones.orange], ["container|storage box", "🗃️", "Storage container", tones.slate], ["water purifier|filter", "🚰", "Water filter", tones.sky],
  ["school|student|education", "🎓", "Education", tones.blue], ["office|business", "💼", "Business item", tones.slate], ["trade|commercial", "📈", "Commercial goods", tones.green],
  ["money|cash|currency", "💰", "Currency-related", tones.yellow], ["card|credit card|debit", "💳", "Payment card", tones.blue], ["key|lock", "🔑", "Keys", tones.yellow],
  ["watch|clock|timepiece", "🕰️", "Timepiece", tones.slate], ["calendar|planner", "🗓️", "Planner", tones.blue], ["stamp|postage", "📮", "Postal item", tones.rose],
  ["letter|mail|envelope", "✉️", "Mail", tones.sky], ["parcel|package|box", "📦", "Parcel", tones.orange], ["barcode|label", "🏷️", "Product label", tones.yellow],
  ["travel adapter|plug", "🔌", "Travel adapter", tones.yellow], ["neck pillow|travel pillow", "🛌", "Travel comfort", tones.violet], ["passport cover|travel wallet", "🛂", "Travel accessory", tones.blue],
  ["tent|camping", "⛺", "Camping gear", tones.green], ["sleeping bag", "🛌", "Sleeping bag", tones.violet], ["flashlight|torch", "🔦", "Flashlight", tones.yellow],
  ["fishing|fishing gear", "🎣", "Fishing gear", tones.sky], ["garden|gardening", "🌱", "Gardening", tones.green], ["flower pot|planter", "🪴", "Planter", tones.green],
  ["baking|bakeware", "🥣", "Baking supplies", tones.orange], ["baby|infant|newborn", "👶", "Baby goods", tones.pink], ["school bag|book bag", "🎒", "School bag", tones.blue],
  ["watch case|jewelry box", "💍", "Jewelry case", tones.pink], ["photo frame|frame", "🖼️", "Photo frame", tones.violet], ["religious book|quran|bible", "📖", "Religious book", tones.green],
  ["camera lens|lens", "🔭", "Camera lens", tones.blue], ["binocular", "🔭", "Binoculars", tones.blue], ["telescope", "🔭", "Telescope", tones.violet],
  ["medical equipment|wheelchair", "🦽", "Medical equipment", tones.rose], ["baby stroller|stroller", "👶", "Baby stroller", tones.sky], ["wheel|tire", "🛞", "Vehicle part", tones.slate],
  ["helmet|safety gear", "⛑️", "Safety gear", tones.rose], ["fire|fire extinguisher", "🧯", "Safety equipment", tones.rose], ["recycle|reusable", "♻️", "Eco goods", tones.green],
  ["cargo|freight|shipment", "📦", "Cargo", tones.orange], ["carry|space|luggage|travel", "🧳", "Carry space", tones.teal], ["flight|airline|airplane", "✈️", "Flight", tones.sky],
  ["train|rail", "🚆", "Train", tones.blue], ["bus|coach", "🚌", "Bus", tones.green], ["bicycle courier|delivery", "🚴", "Delivery", tones.green],
  ["fragile|glass", "⚠️", "Fragile item", tones.yellow], ["cold|frozen", "❄️", "Temperature-sensitive", tones.sky], ["personal|family|other goods|item", "🎁", "Personal item", tones.yellow],
];

const STICKERS: Array<{ match: RegExp; sticker: ProductSticker }> = rules.map(([pattern, emoji, label, tone]) => ({ match: new RegExp(pattern, "i"), sticker: { emoji, label, tone } }));

export function productSticker(...values: Array<string | null | undefined>): ProductSticker {
  const haystack = values.filter(Boolean).join(" ");
  return STICKERS.find(({ match }) => match.test(haystack))?.sticker ?? { emoji: "📦", label: "Goods", tone: "from-amber-100/60 to-yellow-100/30" };
}
