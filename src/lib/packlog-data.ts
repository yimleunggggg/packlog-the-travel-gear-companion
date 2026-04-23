export type ItemStatus = "todo" | "packed";
export type ReviewVerdict = "keep" | "drop" | "upgrade" | null;

export type Item = {
  id: string;
  // Optional reference to a long-lived gear in the user's library.
  // Custom one-off items just leave this null.
  gearId: string | null;
  name: string;
  qty: number;
  weightG: number;
  category: "tech" | "apparel" | "doc" | "health" | "optic" | "misc";
  status: ItemStatus;
  verdict: ReviewVerdict;
  // Per-trip rating (1-5) of how useful this item was. null while planning.
  utility: number | null;
  note?: string;
};

export type Container = {
  id: string;
  code: string;
  name: string;
  type: "checked" | "carry" | "camera" | "personal";
  capacityL: number;
  maxKg: number;
  items: Item[];
};

export type LifecyclePhase = "PLAN" | "PACK" | "REVIEW";

export type Trip = {
  id: string;
  title: string;
  destination: string;
  days: number;
  startDate: string;
  climate: string;
  scenario: "winter-city" | "summer-beach" | "trail-run" | "alpine" | "desert" | "workation" | "general";
  phase: LifecyclePhase;
  containers: Container[];
};

/* === Persistent Gear Library ===
   Long-lived gear that lives across all trips. Each spec carries
   its review history so the user can see "did this help last time?"
*/
export type GearReview = {
  tripId: string;
  tripTitle: string;
  date: string;       // YYYY.MM
  verdict: NonNullable<ReviewVerdict>;
  utility: number;    // 1-5
  note: string;
};

export type GearSpec = {
  id: string;
  name: string;
  brand?: string;
  weightG: number;
  category: Item["category"];
  description: string;        // what is it / why pack it
  ownedSince: string;         // YYYY.MM
  history: GearReview[];      // per-trip usage record
};

export const gearLibrary: GearSpec[] = [
  {
    id: "g-down-parka",
    name: "Down Parka 800FP",
    brand: "Mont-bell Permafrost",
    weightG: 720,
    category: "apparel",
    description: "800-fill goose down hooded parka, water-repellent shell. Compresses to 1.2L. Rated to −15°C with a baselayer.",
    ownedSince: "2023.10",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia / Torres del Paine", date: "2025.11", verdict: "keep", utility: 5, note: "Saved my life on Day 3. MVP." },
      { tripId: "TRP-0118", tripTitle: "Iceland Ring Road", date: "2024.12", verdict: "keep", utility: 5, note: "Wind cut to nothing. Worth every gram." },
    ],
  },
  {
    id: "g-leica-q3",
    name: "Leica Q3",
    brand: "Leica",
    weightG: 743,
    category: "optic",
    description: "Full-frame 60MP fixed 28mm f/1.7. The single most-used object on every trip. Pair with ND filter for daylight wide-open.",
    ownedSince: "2023.07",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Single best decision." },
      { tripId: "TRP-0271", tripTitle: "Tokyo street", date: "2025.04", verdict: "keep", utility: 5, note: "" },
    ],
  },
  {
    id: "g-nd-filter",
    name: "ND Filter 64",
    brand: "K&F Concept 49mm",
    weightG: 38,
    category: "optic",
    description: "6-stop neutral density. Lets you shoot wide-open in noon sun and do long exposures of waterfalls / snow.",
    ownedSince: "2024.02",
    history: [
      { tripId: "TRP-0271", tripTitle: "Tokyo street", date: "2025.04", verdict: "keep", utility: 4, note: "Used on rainy reflections." },
    ],
  },
  {
    id: "g-macbook-air",
    name: "MacBook Air 13",
    brand: "Apple M3",
    weightG: 1240,
    category: "tech",
    description: "Daily driver for editing RAW + writing trip notes. 18h battery, fits any personal item.",
    ownedSince: "2024.04",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 4, note: "Edited photos every night." },
    ],
  },
  {
    id: "g-airpods",
    name: "AirPods Pro 2",
    brand: "Apple",
    weightG: 50,
    category: "tech",
    description: "ANC for long-haul. Transparency mode for street ambience. Charges from MacBook.",
    ownedSince: "2023.09",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "12h flights = essential." },
    ],
  },
  {
    id: "g-snow-boots",
    name: "Snow Boots Sz.42",
    brand: "Sorel Caribou",
    weightG: 1280,
    category: "apparel",
    description: "Waterproof, removable felt liner. Rated −40°C. Heavy but the ONLY thing that worked in Furano.",
    ownedSince: "2024.11",
    history: [],
  },
  {
    id: "g-merino-base",
    name: "Merino Baselayer 200",
    brand: "Smartwool",
    weightG: 210,
    category: "apparel",
    description: "Mid-weight 100% merino. Doesn't smell after 5 days. Pack 3 for any winter trip.",
    ownedSince: "2023.10",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Wore the same one 4 days." },
    ],
  },
  {
    id: "g-passport",
    name: "Passport + Visas",
    weightG: 60,
    category: "doc",
    description: "Plus printed copies in a separate bag. Always personal-carry.",
    ownedSince: "2022.01",
    history: [],
  },
  {
    id: "g-hand-warmer",
    name: "Hand Warmer ×4",
    brand: "Hakkin Peko",
    weightG: 80,
    category: "misc",
    description: "Reusable benzine catalytic warmers. 24h heat, far better than disposable kairo.",
    ownedSince: "2024.12",
    history: [],
  },
  {
    id: "g-ultralight-shell",
    name: "Gore-Tex Shell",
    brand: "Arc'teryx Beta LT",
    weightG: 540,
    category: "apparel",
    description: "3-layer Gore-Tex Pro hardshell. Pit zips. Rolls into hood for stowing.",
    ownedSince: "2023.05",
    history: [
      { tripId: "TRP-0118", tripTitle: "Iceland Ring Road", date: "2024.12", verdict: "keep", utility: 5, note: "Horizontal rain. No drama." },
    ],
  },
  {
    id: "g-trail-runners",
    name: "Trail Runners",
    brand: "Salomon Speedcross 6",
    weightG: 620,
    category: "apparel",
    description: "Aggressive lugs for mud/scree. Not GTX — dries fast. Replace soles every 700km.",
    ownedSince: "2024.06",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "upgrade", utility: 3, note: "Soles destroyed. Need GTX next." },
    ],
  },
  {
    id: "g-power-bank",
    name: "Power Bank 20K",
    brand: "Anker 737",
    weightG: 630,
    category: "tech",
    description: "140W PD, charges MacBook. Heavy but covers a full off-grid day for 3 devices.",
    ownedSince: "2024.03",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Carried 2 phones + camera." },
    ],
  },
];

/* === Trip seed data === */
export const seedTrips: Trip[] = [
  {
    id: "TRP-0421",
    title: "Hokkaido / Winter Recon",
    destination: "Sapporo → Furano → Otaru",
    days: 7,
    startDate: "2026.05.02",
    climate: "−8°C ↔ 3°C  /  Snow",
    scenario: "winter-city",
    phase: "PACK",
    containers: [
      {
        id: "c1", code: "C-01", name: "Checked Duffel", type: "checked",
        capacityL: 80, maxKg: 23,
        items: [
          { id: "i1", gearId: "g-down-parka", name: "Down Parka 800FP", qty: 1, weightG: 720, category: "apparel", status: "packed", verdict: null, utility: null },
          { id: "i2", gearId: "g-merino-base", name: "Merino Baselayer 200", qty: 3, weightG: 210, category: "apparel", status: "packed", verdict: null, utility: null },
          { id: "i3", gearId: null, name: "Insulated Pants", qty: 1, weightG: 480, category: "apparel", status: "packed", verdict: null, utility: null },
          { id: "i4", gearId: "g-ultralight-shell", name: "Gore-Tex Shell", qty: 1, weightG: 540, category: "apparel", status: "todo", verdict: null, utility: null },
          { id: "i5", gearId: "g-snow-boots", name: "Snow Boots Sz.42", qty: 1, weightG: 1280, category: "apparel", status: "packed", verdict: null, utility: null },
          { id: "i6", gearId: null, name: "Toiletry Pouch", qty: 1, weightG: 380, category: "health", status: "todo", verdict: null, utility: null },
          { id: "i7", gearId: null, name: "Spare Cables Kit", qty: 1, weightG: 220, category: "tech", status: "todo", verdict: null, utility: null },
        ],
      },
      {
        id: "c2", code: "C-02", name: "Camera Sling", type: "camera",
        capacityL: 12, maxKg: 6,
        items: [
          { id: "i8", gearId: "g-leica-q3", name: "Leica Q3", qty: 1, weightG: 743, category: "optic", status: "packed", verdict: null, utility: null },
          { id: "i9", gearId: "g-nd-filter", name: "ND Filter 64", qty: 1, weightG: 38, category: "optic", status: "packed", verdict: null, utility: null },
          { id: "i10", gearId: null, name: "Spare Battery BP-SCL6", qty: 2, weightG: 86, category: "optic", status: "packed", verdict: null, utility: null },
          { id: "i11", gearId: null, name: "SD V90 128GB", qty: 2, weightG: 4, category: "optic", status: "todo", verdict: null, utility: null },
          { id: "i12", gearId: null, name: "Lens Cloth", qty: 1, weightG: 6, category: "optic", status: "packed", verdict: null, utility: null },
        ],
      },
      {
        id: "c3", code: "C-03", name: "Personal Carry", type: "personal",
        capacityL: 18, maxKg: 7,
        items: [
          { id: "i13", gearId: "g-passport", name: "Passport + Visas", qty: 1, weightG: 60, category: "doc", status: "packed", verdict: null, utility: null },
          { id: "i14", gearId: "g-macbook-air", name: "MacBook Air 13", qty: 1, weightG: 1240, category: "tech", status: "packed", verdict: null, utility: null },
          { id: "i15", gearId: "g-airpods", name: "AirPods Pro 2", qty: 1, weightG: 50, category: "tech", status: "packed", verdict: null, utility: null },
          { id: "i16", gearId: null, name: "Eye Mask + Earplugs", qty: 1, weightG: 30, category: "health", status: "todo", verdict: null, utility: null },
          { id: "i17", gearId: null, name: "Travel Wallet", qty: 1, weightG: 110, category: "doc", status: "packed", verdict: null, utility: null },
          { id: "i18", gearId: "g-hand-warmer", name: "Hand Warmer ×4", qty: 4, weightG: 80, category: "misc", status: "todo", verdict: null, utility: null },
        ],
      },
    ],
  },
];

/* === Past sealed trip — for the review showcase === */
export const reviewTrip = {
  id: "TRP-0319",
  title: "Patagonia / Torres del Paine",
  date: "2025.11",
  verdicts: [
    { name: "Down Parka 800FP",  verdict: "keep" as const,    utility: 5, note: "Saved my life on Day 3. MVP." },
    { name: "Trail Runners",     verdict: "upgrade" as const, utility: 3, note: "Soles destroyed. Need GTX next." },
    { name: "Travel Pillow",     verdict: "drop" as const,    utility: 1, note: "Never used. Dead weight 320g." },
    { name: "Power Bank 20K",    verdict: "keep" as const,    utility: 5, note: "Carried 2 phones + camera." },
    { name: "Paper Map",         verdict: "drop" as const,    utility: 1, note: "Phone offline maps sufficed." },
    { name: "Leica Q3",          verdict: "keep" as const,    utility: 5, note: "Single best decision." },
  ],
};

/* === Community templates with detailed gear notes === */
export type CommunityItem = {
  name: string;
  weightG: number;
  qty: number;
  category: Item["category"];
  why: string;        // why the author packs this
};

export type CommunityTemplate = {
  id: string;
  author: string;
  rating: number;
  cloned: number;
  title: string;
  scenario: Trip["scenario"];
  climate: string;
  totalWeight: string;
  tags: string[];
  intro: string;
  items: CommunityItem[];
};

export const communityTemplates: CommunityTemplate[] = [
  {
    id: "t1",
    author: "@kenji_walks",
    rating: 4.8,
    cloned: 1284,
    title: "Tokyo / 5D Street Photo",
    scenario: "winter-city",
    climate: "Mild · 12-22°C",
    totalWeight: "8.4kg",
    tags: ["camera", "minimal", "city"],
    intro: "Built around one body + one prime. Everything fits in a single sling so you can shoot from dawn till the last train.",
    items: [
      { name: "Fuji X100VI",        weightG: 521, qty: 1, category: "optic",   why: "Single body, fixed 35mm equiv. Forces you to walk." },
      { name: "Spare Battery NP-W126S", weightG: 47, qty: 2, category: "optic", why: "X100VI eats batteries. Two spares = full shooting day." },
      { name: "ND8 Filter 49mm",    weightG: 30, qty: 1, category: "optic",   why: "Shoot wide-open in noon Tokyo sun." },
      { name: "Peak Design Sling 6L", weightG: 420, qty: 1, category: "misc",  why: "Slim profile, doesn't scream 'tourist'." },
      { name: "Compact Tripod",     weightG: 380, qty: 1, category: "optic",   why: "Blue hour Shibuya scramble." },
      { name: "Suica IC Card",      weightG: 5,   qty: 1, category: "doc",     why: "Tap and go, no fumbling." },
      { name: "Foldable Umbrella",  weightG: 220, qty: 1, category: "misc",    why: "Tokyo rain is binary — none or torrential." },
    ],
  },
  {
    id: "t2",
    author: "@alpine.maria",
    rating: 4.9,
    cloned: 873,
    title: "Iceland Ring Road / 10D",
    scenario: "alpine",
    climate: "Cold · -2-8°C",
    totalWeight: "18.2kg",
    tags: ["self-drive", "outdoor", "rain"],
    intro: "Self-drive loop. Layering > heavy single jacket. Everything must survive horizontal rain.",
    items: [
      { name: "Gore-Tex Hardshell",   weightG: 540,  qty: 1, category: "apparel", why: "Non-negotiable. Iceland will test it." },
      { name: "Down Mid-layer",       weightG: 380,  qty: 1, category: "apparel", why: "Layer under shell on the glacier." },
      { name: "Merino Baselayer 200", weightG: 210,  qty: 3, category: "apparel", why: "Cycle 3, wash never." },
      { name: "Waterproof Pants",     weightG: 320,  qty: 1, category: "apparel", why: "Hot springs walk-back, waterfalls." },
      { name: "Hiking Boots GTX",     weightG: 1100, qty: 1, category: "apparel", why: "Ankle support on lava fields." },
      { name: "Power Bank 20K",       weightG: 630,  qty: 1, category: "tech",    why: "Cabin nights with no outlets." },
      { name: "Headlamp",             weightG: 78,   qty: 1, category: "tech",    why: "Winter = 4hrs of daylight." },
      { name: "Reusable Bottle 1L",   weightG: 180,  qty: 1, category: "misc",    why: "Tap water beats Evian everywhere." },
      { name: "Microfiber Towel",     weightG: 110,  qty: 2, category: "health",  why: "Hot springs etiquette." },
    ],
  },
  {
    id: "t3",
    author: "@trail.rob",
    rating: 4.7,
    cloned: 612,
    title: "Mountain Trail Run / 3D",
    scenario: "trail-run",
    climate: "Cool · 4-15°C",
    totalWeight: "5.1kg",
    tags: ["trail-running", "ultralight", "fastpack"],
    intro: "Fastpacking kit for a 3-day mountain loop. Every gram justifies itself. Nutrition > comfort.",
    items: [
      { name: "Trail Vest 12L",   weightG: 320, qty: 1, category: "misc",    why: "Two soft flasks, phone, bars within reach." },
      { name: "Salomon Sense Pro",weightG: 480, qty: 1, category: "apparel", why: "Aggressive lug, dries in an hour." },
      { name: "Wind Shell 90g",   weightG: 90,  qty: 1, category: "apparel", why: "Ridge-line wind, packs to a fist." },
      { name: "Soft Flask 500ml", weightG: 28,  qty: 2, category: "misc",    why: "Collapses when empty, no sloshing." },
      { name: "Energy Gels",      weightG: 32,  qty: 12,category: "misc",    why: "1 per 45min. Don't skip." },
      { name: "Emergency Bivvy",  weightG: 110, qty: 1, category: "health",  why: "Mandatory for solo above tree-line." },
      { name: "Headlamp 200lm",   weightG: 78,  qty: 1, category: "tech",    why: "For the inevitable late finish." },
    ],
  },
  {
    id: "t4",
    author: "@sandstorm.li",
    rating: 4.6,
    cloned: 388,
    title: "Desert Ultra / 5D",
    scenario: "desert",
    climate: "Hot · 8-38°C",
    totalWeight: "9.8kg",
    tags: ["desert", "self-supported", "ultra"],
    intro: "Self-supported desert run kit. Sun + sand are the enemies. Electrolytes are the religion.",
    items: [
      { name: "Sun Hoodie UPF50",  weightG: 180, qty: 1, category: "apparel", why: "Long sleeves keep sun OFF — cooler than bare arms." },
      { name: "Desert Gaiters",    weightG: 90,  qty: 1, category: "apparel", why: "Sand WILL get in your shoes otherwise." },
      { name: "Buff x2",           weightG: 35,  qty: 2, category: "apparel", why: "Neck cover + sandstorm filter." },
      { name: "Electrolyte Tabs",  weightG: 110, qty: 1, category: "health",  why: "8 tabs/day minimum at 38°C." },
      { name: "SPF50 Sunscreen",   weightG: 110, qty: 1, category: "health",  why: "Reapply every 2hrs. No mercy." },
      { name: "Sleeping Bag +5°C", weightG: 480, qty: 1, category: "misc",    why: "Desert nights drop fast." },
      { name: "Soft Flask 1L",     weightG: 38,  qty: 2, category: "misc",    why: "2L between checkpoints." },
      { name: "Sand Goggles",      weightG: 65,  qty: 1, category: "optic",   why: "When the wind picks up, you'll thank me." },
    ],
  },
];

/* === Scenario-based smart suggestions ===
   Rule-based — nothing is sent to a model. We pick by trip.scenario + climate keywords.
*/
export const scenarioSuggestions: Record<Trip["scenario"], { name: string; weightG: number; category: Item["category"] }[]> = {
  "winter-city": [
    { name: "Travel Adapter (JP Type-A)", weightG: 95, category: "tech" },
    { name: "Hand Warmer ×4", weightG: 80, category: "misc" },
    { name: "Lip Balm", weightG: 12, category: "health" },
    { name: "Beanie", weightG: 70, category: "apparel" },
  ],
  "summer-beach": [
    { name: "Sunscreen SPF50", weightG: 110, category: "health" },
    { name: "Quick-dry Towel", weightG: 180, category: "misc" },
    { name: "Reef-safe Sunblock", weightG: 90, category: "health" },
    { name: "Sunglasses", weightG: 35, category: "apparel" },
  ],
  "trail-run": [
    { name: "Energy Gels", weightG: 32, category: "misc" },
    { name: "Soft Flask 500ml", weightG: 28, category: "misc" },
    { name: "Anti-chafe Balm", weightG: 40, category: "health" },
    { name: "Headlamp 200lm", weightG: 78, category: "tech" },
  ],
  "alpine": [
    { name: "Gore-Tex Shell", weightG: 540, category: "apparel" },
    { name: "Headlamp", weightG: 78, category: "tech" },
    { name: "Buff", weightG: 35, category: "apparel" },
    { name: "Power Bank 20K", weightG: 630, category: "tech" },
  ],
  "desert": [
    { name: "Sun Hoodie UPF50", weightG: 180, category: "apparel" },
    { name: "Electrolyte Tabs", weightG: 110, category: "health" },
    { name: "Buff", weightG: 35, category: "apparel" },
    { name: "Sand Gaiters", weightG: 90, category: "apparel" },
  ],
  "workation": [
    { name: "Travel Adapter", weightG: 95, category: "tech" },
    { name: "Noise-Cancelling Headphones", weightG: 250, category: "tech" },
    { name: "USB-C Hub", weightG: 90, category: "tech" },
    { name: "Compact Mouse", weightG: 90, category: "tech" },
  ],
  "general": [
    { name: "Travel Adapter", weightG: 95, category: "tech" },
    { name: "Microfiber Towel", weightG: 110, category: "health" },
    { name: "Power Bank 10K", weightG: 220, category: "tech" },
    { name: "Reusable Bottle 500ml", weightG: 280, category: "misc" },
  ],
};

/* === Default container template for a fresh trip === */
export function makeFreshTrip(args: {
  title: string;
  destination: string;
  days: number;
  startDate: string;
  climate: string;
  scenario: Trip["scenario"];
}): Trip {
  const id = `TRP-${Math.floor(Math.random() * 9000 + 1000)}`;
  return {
    id,
    title: args.title,
    destination: args.destination,
    days: args.days,
    startDate: args.startDate,
    climate: args.climate,
    scenario: args.scenario,
    phase: "PLAN",
    containers: [
      { id: `${id}-c1`, code: "C-01", name: "Checked Duffel",  type: "checked",  capacityL: 80, maxKg: 23, items: [] },
      { id: `${id}-c2`, code: "C-02", name: "Carry Backpack",  type: "carry",    capacityL: 28, maxKg: 10, items: [] },
      { id: `${id}-c3`, code: "C-03", name: "Personal Carry",  type: "personal", capacityL: 18, maxKg: 7,  items: [] },
    ],
  };
}
