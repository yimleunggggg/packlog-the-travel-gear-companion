import type { ScenarioKey, SeedItem } from "./scenario-templates";
import { scenarioTemplates } from "./scenario-templates";
import type { SelectedDestination } from "./destinations";

export type ItemStatus = "todo" | "packed";
export type ReviewVerdict = "keep" | "drop" | "upgrade" | null;
export type Ownership = "owned" | "wishlist" | "undecided";

export type Item = {
  id: string;
  // Optional reference to a long-lived gear in the user's library.
  gearId: string | null;
  // Bilingual labels — fall back to `name` for legacy.
  name: string;            // fallback / English display
  nameEn?: string;
  nameZh?: string;
  qty: number;
  weightG: number;
  weightSource?: "library" | "user" | "spec";
  category: "tech" | "apparel" | "doc" | "health" | "optic" | "misc";
  status: ItemStatus;
  verdict: ReviewVerdict;
  utility: number | null;
  ownership: Ownership;    // do I actually own this yet?
  brand?: string;          // optional, refined later
  model?: string;          // optional, refined later
  // Stable SKU for shared identification across users + community.
  // Format: "<brand-slug>:<model-slug>" or "generic:<name-slug>".
  // Anything sharing the same sku is the same physical product.
  sku?: string;
  note?: string;
};

// Container types — covers most travel scenarios users described.
export type ContainerType =
  | "checked"     // 托运行李箱
  | "carry"       // 登机箱
  | "personal"    // 随身包 / personal item
  | "daypack"     // 城市日用背包
  | "hike"        // 登山包 / 户外背包
  | "camera"      // 相机包
  | "toiletry"    // 洗漱包
  | "makeup"      // 化妆包
  | "tech"        // 数码包 / 电子配件包
  | "clothing"    // 衣物收纳包
  | "custom";     // 自定义

export type Container = {
  id: string;
  code: string;
  name: string;            // fallback (en)
  nameZh?: string;
  type: ContainerType;
  capacityL: number;
  maxKg: number;
  items: Item[];
};

// PLAN merged into PACK — only two phases now.
export type LifecyclePhase = "PACK" | "REVIEW";

export type Trip = {
  id: string;
  title: string;
  destinations: SelectedDestination[];
  days: number;
  startDate: string;       // YYYY.MM.DD
  climate: string;
  scenario: ScenarioKey;
  phase: LifecyclePhase;
  containers: Container[];
};

/* === Persistent Gear Library === */
export type GearReview = {
  tripId: string;
  tripTitle: string;
  date: string;
  verdict: NonNullable<ReviewVerdict>;
  utility: number;
  note: string;
};

export type GearSpec = {
  id: string;
  name: string;            // fallback (en)
  nameEn?: string;
  nameZh?: string;
  brand?: string;
  weightG: number;
  category: Item["category"];
  description: string;
  descriptionZh?: string;
  ownedSince: string;
  ownership: Ownership;
  history: GearReview[];
};

export const gearLibrary: GearSpec[] = [
  {
    id: "g-down-parka", name: "Down Parka 800FP", nameEn: "Down Parka 800FP", nameZh: "羽绒服 800FP",
    brand: "Mont-bell Permafrost", weightG: 720, category: "apparel", ownership: "owned",
    description: "800-fill goose down hooded parka. Compresses to 1.2L. Rated to −15°C.",
    descriptionZh: "800蓬鹅绒带帽羽绒服，可压缩至 1.2L。−15°C 级别。",
    ownedSince: "2023.10",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia / Torres del Paine", date: "2025.11", verdict: "keep", utility: 5, note: "Saved my life on Day 3. MVP." },
      { tripId: "TRP-0118", tripTitle: "Iceland Ring Road", date: "2024.12", verdict: "keep", utility: 5, note: "Wind cut to nothing." },
    ],
  },
  {
    id: "g-leica-q3", name: "Leica Q3", nameEn: "Leica Q3", nameZh: "徕卡 Q3",
    brand: "Leica", weightG: 743, category: "optic", ownership: "owned",
    description: "Full-frame 60MP fixed 28mm f/1.7. The single most-used object on every trip.",
    descriptionZh: "全画幅 60MP，固定 28mm f/1.7。每次旅行都用最多的一件装备。",
    ownedSince: "2023.07",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Single best decision." },
      { tripId: "TRP-0271", tripTitle: "Tokyo street", date: "2025.04", verdict: "keep", utility: 5, note: "" },
    ],
  },
  {
    id: "g-nd-filter", name: "ND Filter 64", nameEn: "ND Filter 64", nameZh: "ND64 滤镜",
    brand: "K&F Concept 49mm", weightG: 38, category: "optic", ownership: "owned",
    description: "6-stop neutral density. Lets you shoot wide-open in noon sun.",
    descriptionZh: "6 档减光。正午阳光下可保持大光圈。",
    ownedSince: "2024.02",
    history: [
      { tripId: "TRP-0271", tripTitle: "Tokyo street", date: "2025.04", verdict: "keep", utility: 4, note: "Used on rainy reflections." },
    ],
  },
  {
    id: "g-macbook-air", name: "MacBook Air 13", nameEn: "MacBook Air 13", nameZh: "MacBook Air 13",
    brand: "Apple M3", weightG: 1240, category: "tech", ownership: "owned",
    description: "Daily driver for editing RAW + writing trip notes. 18h battery.",
    descriptionZh: "每日修图与写笔记。18 小时续航。",
    ownedSince: "2024.04",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 4, note: "Edited photos every night." },
    ],
  },
  {
    id: "g-airpods", name: "AirPods Pro 2", nameEn: "AirPods Pro 2", nameZh: "AirPods Pro 2",
    brand: "Apple", weightG: 50, category: "tech", ownership: "owned",
    description: "ANC for long-haul. Charges from MacBook.",
    descriptionZh: "降噪，长途航班必备。可由 MacBook 反向供电。",
    ownedSince: "2023.09",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "12h flights = essential." },
    ],
  },
  {
    id: "g-snow-boots", name: "Snow Boots Sz.42", nameEn: "Snow Boots Sz.42", nameZh: "雪地靴 42码",
    brand: "Sorel Caribou", weightG: 1280, category: "apparel", ownership: "owned",
    description: "Waterproof, removable felt liner. Rated −40°C.",
    descriptionZh: "防水可拆毛毡内胆。−40°C 级别。",
    ownedSince: "2024.11", history: [],
  },
  {
    id: "g-merino-base", name: "Merino Baselayer 200", nameEn: "Merino Baselayer 200", nameZh: "美利奴打底 200",
    brand: "Smartwool", weightG: 210, category: "apparel", ownership: "owned",
    description: "Mid-weight 100% merino. Doesn't smell after 5 days.",
    descriptionZh: "中量 100% 美利奴羊毛。穿 5 天不臭。",
    ownedSince: "2023.10",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Wore the same one 4 days." },
    ],
  },
  {
    id: "g-passport", name: "Passport + Visas", nameEn: "Passport + Visas", nameZh: "护照 + 签证",
    weightG: 60, category: "doc", ownership: "owned",
    description: "Plus printed copies in a separate bag. Always personal-carry.",
    descriptionZh: "另带复印件，永远随身。",
    ownedSince: "2022.01", history: [],
  },
  {
    id: "g-hand-warmer", name: "Hand Warmer ×4", nameEn: "Hand Warmer ×4", nameZh: "暖宝宝 ×4",
    brand: "Hakkin Peko", weightG: 80, category: "misc", ownership: "owned",
    description: "Reusable benzine catalytic warmers. 24h heat.",
    descriptionZh: "可重复使用白金触媒暖手宝，24 小时持续发热。",
    ownedSince: "2024.12", history: [],
  },
  {
    id: "g-ultralight-shell", name: "Gore-Tex Shell", nameEn: "Gore-Tex Shell", nameZh: "Gore-Tex 硬壳",
    brand: "Arc'teryx Beta LT", weightG: 540, category: "apparel", ownership: "owned",
    description: "3-layer Gore-Tex Pro hardshell. Pit zips.",
    descriptionZh: "三层 Gore-Tex Pro 硬壳，腋下拉链透气。",
    ownedSince: "2023.05",
    history: [
      { tripId: "TRP-0118", tripTitle: "Iceland Ring Road", date: "2024.12", verdict: "keep", utility: 5, note: "Horizontal rain. No drama." },
    ],
  },
  {
    id: "g-trail-runners", name: "Trail Runners", nameEn: "Trail Runners", nameZh: "越野跑鞋",
    brand: "Salomon Speedcross 6", weightG: 620, category: "apparel", ownership: "owned",
    description: "Aggressive lugs for mud/scree. Not GTX — dries fast.",
    descriptionZh: "深齿大底，泥地与碎石强抓地。非 GTX 版本，湿后快干。",
    ownedSince: "2024.06",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "upgrade", utility: 3, note: "Soles destroyed. Need GTX next." },
    ],
  },
  {
    id: "g-power-bank", name: "Power Bank 20K", nameEn: "Power Bank 20K", nameZh: "充电宝 20K",
    brand: "Anker 737", weightG: 630, category: "tech", ownership: "owned",
    description: "140W PD, charges MacBook. Heavy but covers a full off-grid day.",
    descriptionZh: "140W PD，可给 MacBook 供电。略重但能覆盖一天无电源。",
    ownedSince: "2024.03",
    history: [
      { tripId: "TRP-0319", tripTitle: "Patagonia", date: "2025.11", verdict: "keep", utility: 5, note: "Carried 2 phones + camera." },
    ],
  },
];

/* === Trip seed data === */
import { destinationTree } from "./destinations";
const find = (cityId: string): SelectedDestination | null => {
  for (const c of destinationTree)
    for (const r of c.regions)
      for (const ci of r.cities)
        if (ci.id === cityId)
          return { id: ci.id, countryId: c.id, regionId: r.id, cityEn: ci.en, cityZh: ci.zh, countryFlag: c.flag };
  return null;
};
const dest = (...ids: string[]) => ids.map(find).filter(Boolean) as SelectedDestination[];

export const seedTrips: Trip[] = [
  {
    id: "TRP-0421",
    title: "Hokkaido / Winter Recon",
    destinations: dest("jp-sapporo", "jp-furano", "jp-otaru"),
    days: 7,
    startDate: "2026.05.02",
    climate: "−8°C ↔ 3°C  /  Snow",
    scenario: "winter-city",
    phase: "PACK",
    containers: [
      {
        id: "c1", code: "C-01", name: "Checked Duffel", nameZh: "托运行李", type: "checked",
        capacityL: 80, maxKg: 23,
        items: [
          { id: "i1", gearId: "g-down-parka", name: "Down Parka 800FP", nameEn: "Down Parka 800FP", nameZh: "羽绒服 800FP", qty: 1, weightG: 720, weightSource: "library", category: "apparel", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i2", gearId: "g-merino-base", name: "Merino Baselayer 200", nameEn: "Merino Baselayer 200", nameZh: "美利奴打底 200", qty: 3, weightG: 210, weightSource: "library", category: "apparel", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i3", gearId: null, name: "Insulated Pants", nameEn: "Insulated Pants", nameZh: "保暖长裤", qty: 1, weightG: 480, weightSource: "library", category: "apparel", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i4", gearId: "g-ultralight-shell", name: "Gore-Tex Shell", nameEn: "Gore-Tex Shell", nameZh: "Gore-Tex 硬壳", qty: 1, weightG: 540, weightSource: "library", category: "apparel", status: "todo", verdict: null, utility: null, ownership: "owned" },
          { id: "i5", gearId: "g-snow-boots", name: "Snow Boots Sz.42", nameEn: "Snow Boots Sz.42", nameZh: "雪地靴 42码", qty: 1, weightG: 1280, weightSource: "library", category: "apparel", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i6", gearId: null, name: "Toiletry Pouch", nameEn: "Toiletry Pouch", nameZh: "洗漱包", qty: 1, weightG: 380, weightSource: "library", category: "health", status: "todo", verdict: null, utility: null, ownership: "owned" },
          { id: "i7", gearId: null, name: "Spare Cables Kit", nameEn: "Spare Cables Kit", nameZh: "备用线材包", qty: 1, weightG: 220, weightSource: "library", category: "tech", status: "todo", verdict: null, utility: null, ownership: "owned" },
        ],
      },
      {
        id: "c2", code: "C-02", name: "Camera Sling", nameZh: "相机包", type: "camera",
        capacityL: 12, maxKg: 6,
        items: [
          { id: "i8", gearId: "g-leica-q3", name: "Leica Q3", nameEn: "Leica Q3", nameZh: "徕卡 Q3", qty: 1, weightG: 743, weightSource: "library", category: "optic", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i9", gearId: "g-nd-filter", name: "ND Filter 64", nameEn: "ND Filter 64", nameZh: "ND64 滤镜", qty: 1, weightG: 38, weightSource: "library", category: "optic", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i10", gearId: null, name: "Spare Battery BP-SCL6", nameEn: "Spare Battery BP-SCL6", nameZh: "备用电池 BP-SCL6", qty: 2, weightG: 86, weightSource: "spec", category: "optic", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i11", gearId: null, name: "SD V90 128GB", nameEn: "SD V90 128GB", nameZh: "SD V90 128GB", qty: 2, weightG: 4, weightSource: "spec", category: "optic", status: "todo", verdict: null, utility: null, ownership: "owned" },
          { id: "i12", gearId: null, name: "Lens Cloth", nameEn: "Lens Cloth", nameZh: "镜头布", qty: 1, weightG: 6, weightSource: "user", category: "optic", status: "packed", verdict: null, utility: null, ownership: "owned" },
        ],
      },
      {
        id: "c3", code: "C-03", name: "Personal Carry", nameZh: "随身包", type: "personal",
        capacityL: 18, maxKg: 7,
        items: [
          { id: "i13", gearId: "g-passport", name: "Passport + Visas", nameEn: "Passport + Visas", nameZh: "护照 + 签证", qty: 1, weightG: 60, weightSource: "library", category: "doc", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i14", gearId: "g-macbook-air", name: "MacBook Air 13", nameEn: "MacBook Air 13", nameZh: "MacBook Air 13", qty: 1, weightG: 1240, weightSource: "library", category: "tech", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i15", gearId: "g-airpods", name: "AirPods Pro 2", nameEn: "AirPods Pro 2", nameZh: "AirPods Pro 2", qty: 1, weightG: 50, weightSource: "library", category: "tech", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i16", gearId: null, name: "Eye Mask + Earplugs", nameEn: "Eye Mask + Earplugs", nameZh: "眼罩 + 耳塞", qty: 1, weightG: 30, weightSource: "user", category: "health", status: "todo", verdict: null, utility: null, ownership: "owned" },
          { id: "i17", gearId: null, name: "Travel Wallet", nameEn: "Travel Wallet", nameZh: "旅行钱包", qty: 1, weightG: 110, weightSource: "library", category: "doc", status: "packed", verdict: null, utility: null, ownership: "owned" },
          { id: "i18", gearId: "g-hand-warmer", name: "Hand Warmer ×4", nameEn: "Hand Warmer ×4", nameZh: "暖宝宝 ×4", qty: 4, weightG: 80, weightSource: "library", category: "misc", status: "todo", verdict: null, utility: null, ownership: "owned" },
        ],
      },
    ],
  },
  {
    id: "TRP-0388",
    title: "Yading / Spring Trail",
    destinations: dest("cn-daocheng", "cn-chengdu"),
    days: 6, startDate: "2026.04.18",
    climate: "−2°C ↔ 14°C  /  高反预警",
    scenario: "alpine", phase: "PACK",
    containers: [
      { id: "y-c1", code: "C-01", name: "Trekking Pack 50L", nameZh: "登山包 50L", type: "checked", capacityL: 50, maxKg: 18,
        items: [
          { id: "yi1", gearId: "g-ultralight-shell", name: "Gore-Tex Shell", nameEn: "Gore-Tex Shell", nameZh: "Gore-Tex 硬壳", qty: 1, weightG: 540, weightSource: "library", category: "apparel", status: "todo", verdict: null, utility: null, ownership: "owned" },
          { id: "yi2", gearId: null, name: "Down Mid-layer", nameEn: "Down Mid-layer", nameZh: "羽绒中层", qty: 1, weightG: 380, weightSource: "library", category: "apparel", status: "todo", verdict: null, utility: null, ownership: "owned" },
        ],
      },
      { id: "y-c2", code: "C-02", name: "Camera Sling", nameZh: "相机包", type: "camera", capacityL: 8, maxKg: 4, items: [] },
      { id: "y-c3", code: "C-03", name: "Personal Carry", nameZh: "随身包", type: "personal", capacityL: 18, maxKg: 7, items: [
        { id: "yi3", gearId: "g-passport", name: "Passport + Visas", nameEn: "Passport + Visas", nameZh: "护照 + 签证", qty: 1, weightG: 60, weightSource: "library", category: "doc", status: "packed", verdict: null, utility: null, ownership: "owned" },
      ]},
    ],
  },
  {
    id: "TRP-0319",
    title: "Patagonia / Torres del Paine",
    destinations: dest("ar-elcalafate", "ar-elchalten"),
    days: 11, startDate: "2025.11.04",
    climate: "−5°C ↔ 12°C  /  Wind",
    scenario: "alpine", phase: "REVIEW",
    containers: [],
  },
];

/* === Past sealed trip — for the review showcase === */
export const reviewTrip = {
  id: "TRP-0319",
  title: "Patagonia / Torres del Paine",
  date: "2025.11",
  verdicts: [
    { name: "Down Parka 800FP", nameZh: "羽绒服 800FP", verdict: "keep" as const, utility: 5, note: "Saved my life on Day 3. MVP." },
    { name: "Trail Runners", nameZh: "越野跑鞋", verdict: "upgrade" as const, utility: 3, note: "Soles destroyed. Need GTX next." },
    { name: "Travel Pillow", nameZh: "旅行枕", verdict: "drop" as const, utility: 1, note: "Never used. Dead weight 320g." },
    { name: "Power Bank 20K", nameZh: "充电宝 20K", verdict: "keep" as const, utility: 5, note: "Carried 2 phones + camera." },
    { name: "Paper Map", nameZh: "纸质地图", verdict: "drop" as const, utility: 1, note: "Phone offline maps sufficed." },
    { name: "Leica Q3", nameZh: "徕卡 Q3", verdict: "keep" as const, utility: 5, note: "Single best decision." },
  ],
};

/* === Community templates === */
export type CommunityItem = {
  name: string;
  nameZh?: string;
  weightG: number;
  qty: number;
  category: Item["category"];
  why: string;
  whyZh?: string;
};

export type CommunityTemplate = {
  id: string;
  author: string;
  rating: number;
  cloned: number;
  title: string;
  titleZh?: string;
  scenario: ScenarioKey;
  climate: string;
  totalWeight: string;
  tags: string[];
  intro: string;
  introZh?: string;
  items: CommunityItem[];
};

export const communityTemplates: CommunityTemplate[] = [
  {
    id: "t1", author: "@kenji_walks", rating: 4.8, cloned: 1284,
    title: "Tokyo / 5D Street Photo", titleZh: "东京 / 5天街拍",
    scenario: "winter-city", climate: "Mild · 12-22°C", totalWeight: "8.4kg",
    tags: ["camera", "minimal", "city"],
    intro: "One body + one prime. Everything fits in a single sling.",
    introZh: "一机一镜。所有东西塞进一个单肩包。",
    items: [
      { name: "Fuji X100VI", nameZh: "富士 X100VI", weightG: 521, qty: 1, category: "optic", why: "Single body, fixed 35mm equiv.", whyZh: "一机一镜，等效 35mm。" },
      { name: "Spare Battery NP-W126S", nameZh: "备用电池 NP-W126S", weightG: 47, qty: 2, category: "optic", why: "X100VI eats batteries.", whyZh: "X100VI 耗电，多带两块。" },
      { name: "ND8 Filter 49mm", nameZh: "ND8 滤镜 49mm", weightG: 30, qty: 1, category: "optic", why: "Shoot wide-open at noon.", whyZh: "正午也能开大光圈。" },
      { name: "Peak Design Sling 6L", nameZh: "Peak Design 单肩包 6L", weightG: 420, qty: 1, category: "misc", why: "Slim, low-profile.", whyZh: "薄身低调。" },
      { name: "Compact Tripod", nameZh: "便携三脚架", weightG: 380, qty: 1, category: "optic", why: "Blue hour Shibuya scramble.", whyZh: "涩谷蓝调慢门。" },
      { name: "Suica IC Card", nameZh: "Suica 西瓜卡", weightG: 5, qty: 1, category: "doc", why: "Tap and go.", whyZh: "刷卡就走。" },
      { name: "Foldable Umbrella", nameZh: "折叠伞", weightG: 220, qty: 1, category: "misc", why: "Tokyo rain is binary.", whyZh: "东京下雨没有中间状态。" },
    ],
  },
  {
    id: "t2", author: "@alpine.maria", rating: 4.9, cloned: 873,
    title: "Iceland Ring Road / 10D", titleZh: "冰岛环岛 / 10天",
    scenario: "alpine", climate: "Cold · -2-8°C", totalWeight: "18.2kg",
    tags: ["self-drive", "outdoor", "rain"],
    intro: "Self-drive loop. Layering > heavy single jacket.",
    introZh: "自驾环岛。多层穿搭胜过单件厚衣。",
    items: [
      { name: "Gore-Tex Hardshell", nameZh: "Gore-Tex 硬壳", weightG: 540, qty: 1, category: "apparel", why: "Non-negotiable.", whyZh: "刚需。" },
      { name: "Down Mid-layer", nameZh: "羽绒中层", weightG: 380, qty: 1, category: "apparel", why: "Layer under shell.", whyZh: "硬壳下叠穿。" },
      { name: "Merino Baselayer 200", nameZh: "美利奴打底 200", weightG: 210, qty: 3, category: "apparel", why: "Cycle 3, wash never.", whyZh: "三件循环不洗。" },
      { name: "Waterproof Pants", nameZh: "防水裤", weightG: 320, qty: 1, category: "apparel", why: "Hot springs walk-back.", whyZh: "温泉来回路上。" },
      { name: "Hiking Boots GTX", nameZh: "GTX 登山靴", weightG: 1100, qty: 1, category: "apparel", why: "Ankle support on lava.", whyZh: "熔岩地脚踝保护。" },
      { name: "Power Bank 20K", nameZh: "充电宝 20K", weightG: 630, qty: 1, category: "tech", why: "Cabin nights with no outlets.", whyZh: "小木屋无插座。" },
      { name: "Headlamp", nameZh: "头灯", weightG: 78, qty: 1, category: "tech", why: "4hrs of daylight in winter.", whyZh: "冬季只有 4 小时白天。" },
      { name: "Reusable Bottle 1L", nameZh: "保温水壶 1L", weightG: 180, qty: 1, category: "misc", why: "Tap water beats Evian.", whyZh: "自来水比 Evian 还甜。" },
      { name: "Microfiber Towel", nameZh: "速干毛巾", weightG: 110, qty: 2, category: "health", why: "Hot springs etiquette.", whyZh: "温泉礼仪。" },
    ],
  },
  {
    id: "t3", author: "@trail.rob", rating: 4.7, cloned: 612,
    title: "Mountain Trail Run / 3D", titleZh: "山地越野跑 / 3天",
    scenario: "trail-run", climate: "Cool · 4-15°C", totalWeight: "5.1kg",
    tags: ["trail-running", "ultralight", "fastpack"],
    intro: "Fastpacking kit for a 3-day mountain loop.",
    introZh: "三天山地环线快包套装。",
    items: [
      { name: "Trail Vest 12L", nameZh: "越野跑包 12L", weightG: 320, qty: 1, category: "misc", why: "Two soft flasks within reach.", whyZh: "两个软水壶顺手取。" },
      { name: "Salomon Sense Pro", nameZh: "萨洛蒙 Sense Pro", weightG: 480, qty: 1, category: "apparel", why: "Aggressive lug, dries fast.", whyZh: "深齿大底快干。" },
      { name: "Wind Shell 90g", nameZh: "风衣 90g", weightG: 90, qty: 1, category: "apparel", why: "Ridge-line wind, fist size.", whyZh: "山脊抗风，拳头大。" },
      { name: "Soft Flask 500ml", nameZh: "软水壶 500ml", weightG: 28, qty: 2, category: "misc", why: "Collapses when empty.", whyZh: "空了可折叠。" },
      { name: "Energy Gels", nameZh: "能量胶", weightG: 32, qty: 12, category: "misc", why: "1 per 45min.", whyZh: "每 45 分钟一个。" },
      { name: "Emergency Bivvy", nameZh: "应急睡袋", weightG: 110, qty: 1, category: "health", why: "Mandatory solo above tree-line.", whyZh: "线上独行必备。" },
      { name: "Headlamp 200lm", nameZh: "头灯 200 流明", weightG: 78, qty: 1, category: "tech", why: "For the late finish.", whyZh: "应对晚归。" },
    ],
  },
  {
    id: "t4", author: "@sandstorm.li", rating: 4.6, cloned: 388,
    title: "Desert Ultra / 5D", titleZh: "沙漠超级越野 / 5天",
    scenario: "desert", climate: "Hot · 8-38°C", totalWeight: "9.8kg",
    tags: ["desert", "self-supported", "ultra"],
    intro: "Self-supported desert run kit. Sun + sand are the enemies.",
    introZh: "无补给沙漠跑装备。日晒和沙是天敌。",
    items: [
      { name: "Sun Hoodie UPF50", nameZh: "防晒长袖 UPF50", weightG: 180, qty: 1, category: "apparel", why: "Long sleeves keep sun OFF.", whyZh: "长袖比裸露更凉。" },
      { name: "Desert Gaiters", nameZh: "沙套", weightG: 90, qty: 1, category: "apparel", why: "Sand WILL get in.", whyZh: "不戴沙必进鞋。" },
      { name: "Buff x2", nameZh: "魔术头巾 ×2", weightG: 35, qty: 2, category: "apparel", why: "Neck cover + sandstorm filter.", whyZh: "护颈 + 沙暴过滤。" },
      { name: "Electrolyte Tabs", nameZh: "电解质泡腾片", weightG: 110, qty: 1, category: "health", why: "8 tabs/day at 38°C.", whyZh: "38°C 一天 8 片起。" },
      { name: "SPF50 Sunscreen", nameZh: "SPF50 防晒霜", weightG: 110, qty: 1, category: "health", why: "Reapply every 2hrs.", whyZh: "两小时补一次。" },
      { name: "Sleeping Bag +5°C", nameZh: "睡袋 +5°C", weightG: 480, qty: 1, category: "misc", why: "Desert nights drop fast.", whyZh: "沙漠夜温骤降。" },
      { name: "Soft Flask 1L", nameZh: "软水壶 1L", weightG: 38, qty: 2, category: "misc", why: "2L between checkpoints.", whyZh: "补给点间需 2L。" },
      { name: "Sand Goggles", nameZh: "防沙镜", weightG: 65, qty: 1, category: "optic", why: "Wind picks up, you'll thank me.", whyZh: "起风时你会感谢我。" },
    ],
  },
  {
    id: "t5", author: "@niseko.snow", rating: 4.9, cloned: 924,
    title: "Niseko Ski / 7D", titleZh: "二世古滑雪 / 7天",
    scenario: "ski", climate: "Cold · -15-0°C", totalWeight: "16.5kg",
    tags: ["ski", "powder", "japan"],
    intro: "Powder week. Layer for −15°C lift, regulate for hot springs after.",
    introZh: "粉雪周。−15°C 缆车保暖，雪后温泉。",
    items: [
      { name: "Ski Jacket 3L", nameZh: "滑雪服 3 层", weightG: 1200, qty: 1, category: "apparel", why: "3-layer Gore-Tex for deep days.", whyZh: "三层 Gore-Tex 粉雪日。" },
      { name: "Ski Pants Bib", nameZh: "背带滑雪裤", weightG: 980, qty: 1, category: "apparel", why: "Bib keeps snow out on faceplants.", whyZh: "背带防雪进腰。" },
      { name: "Ski Goggles + Spare Lens", nameZh: "雪镜 + 备用镜片", weightG: 220, qty: 1, category: "optic", why: "Low-light lens for whiteout days.", whyZh: "低光镜片应对白茫天。" },
      { name: "Helmet", nameZh: "雪盔", weightG: 520, qty: 1, category: "apparel", why: "Niseko trees demand it.", whyZh: "二世古林间必备。" },
      { name: "Merino Baselayer ×3", nameZh: "美利奴打底 ×3", weightG: 220, qty: 3, category: "apparel", why: "Wick sweat on-piste, dry overnight.", whyZh: "排汗，过夜干。" },
      { name: "Hand Warmer ×6", nameZh: "暖宝宝 ×6", weightG: 80, qty: 6, category: "misc", why: "One per glove per day.", whyZh: "每天每只手套一个。" },
      { name: "GoPro Hero", nameZh: "GoPro Hero", weightG: 153, qty: 1, category: "optic", why: "Helmet POV in tree runs.", whyZh: "穿林第一视角。" },
      { name: "Onsen Towel", nameZh: "温泉毛巾", weightG: 110, qty: 1, category: "health", why: "Etiquette + wipe-off.", whyZh: "礼仪 + 擦身。" },
    ],
  },
];

/* === Scenario-based smart suggestions === */
export const scenarioSuggestions: Record<ScenarioKey, { name: string; nameZh: string; weightG: number; category: Item["category"] }[]> = {
  "winter-city": [
    { name: "Travel Adapter (JP Type-A)", nameZh: "电源转换器（日本 Type-A）", weightG: 95, category: "tech" },
    { name: "Hand Warmer ×4", nameZh: "暖宝宝 ×4", weightG: 80, category: "misc" },
    { name: "Lip Balm", nameZh: "润唇膏", weightG: 12, category: "health" },
    { name: "Beanie", nameZh: "毛线帽", weightG: 70, category: "apparel" },
  ],
  "summer-beach": [
    { name: "Sunscreen SPF50", nameZh: "防晒霜 SPF50", weightG: 110, category: "health" },
    { name: "Quick-dry Towel", nameZh: "速干毛巾", weightG: 180, category: "misc" },
    { name: "Reef-safe Sunblock", nameZh: "珊瑚礁防晒", weightG: 90, category: "health" },
    { name: "Sunglasses", nameZh: "墨镜", weightG: 35, category: "apparel" },
  ],
  "trail-run": [
    { name: "Energy Gels", nameZh: "能量胶", weightG: 32, category: "misc" },
    { name: "Soft Flask 500ml", nameZh: "软水壶 500ml", weightG: 28, category: "misc" },
    { name: "Anti-chafe Balm", nameZh: "防摩擦膏", weightG: 40, category: "health" },
    { name: "Headlamp 200lm", nameZh: "头灯 200 流明", weightG: 78, category: "tech" },
  ],
  "alpine": [
    { name: "Gore-Tex Shell", nameZh: "Gore-Tex 硬壳", weightG: 540, category: "apparel" },
    { name: "Headlamp", nameZh: "头灯", weightG: 78, category: "tech" },
    { name: "Buff", nameZh: "魔术头巾", weightG: 35, category: "apparel" },
    { name: "Power Bank 20K", nameZh: "充电宝 20K", weightG: 630, category: "tech" },
  ],
  "desert": [
    { name: "Sun Hoodie UPF50", nameZh: "防晒长袖 UPF50", weightG: 180, category: "apparel" },
    { name: "Electrolyte Tabs", nameZh: "电解质泡腾片", weightG: 110, category: "health" },
    { name: "Buff", nameZh: "魔术头巾", weightG: 35, category: "apparel" },
    { name: "Sand Gaiters", nameZh: "沙套", weightG: 90, category: "apparel" },
  ],
  "workation": [
    { name: "Travel Adapter", nameZh: "电源转换器", weightG: 95, category: "tech" },
    { name: "Noise-Cancelling Headphones", nameZh: "降噪耳机", weightG: 250, category: "tech" },
    { name: "USB-C Hub", nameZh: "USB-C 拓展坞", weightG: 90, category: "tech" },
    { name: "Compact Mouse", nameZh: "便携鼠标", weightG: 90, category: "tech" },
  ],
  "ski": [
    { name: "Ski Goggles", nameZh: "雪镜", weightG: 180, category: "optic" },
    { name: "Hand Warmer", nameZh: "暖宝宝", weightG: 80, category: "misc" },
    { name: "Helmet", nameZh: "雪盔", weightG: 520, category: "apparel" },
    { name: "Lip Balm SPF", nameZh: "防晒润唇膏", weightG: 12, category: "health" },
  ],
  "dive": [
    { name: "Mask + Snorkel", nameZh: "面镜 + 呼吸管", weightG: 420, category: "misc" },
    { name: "Dive Computer", nameZh: "潜水电脑表", weightG: 90, category: "tech" },
    { name: "Reef-safe Sunblock", nameZh: "珊瑚礁防晒", weightG: 90, category: "health" },
    { name: "Dry Bag 20L", nameZh: "防水袋 20L", weightG: 280, category: "misc" },
  ],
  "general": [
    { name: "Travel Adapter", nameZh: "电源转换器", weightG: 95, category: "tech" },
    { name: "Microfiber Towel", nameZh: "速干毛巾", weightG: 110, category: "health" },
    { name: "Power Bank 10K", nameZh: "充电宝 10K", weightG: 220, category: "tech" },
    { name: "Reusable Bottle 500ml", nameZh: "保温水壶 500ml", weightG: 280, category: "misc" },
  ],
};

/* === Default container template + scenario seeding === */
export function makeFreshTrip(args: {
  title: string;
  destinations: SelectedDestination[];
  days: number;
  startDate: string;
  climate: string;
  scenario: ScenarioKey;
  seedFromScenario?: boolean;
}): Trip {
  const id = `TRP-${Math.floor(Math.random() * 9000 + 1000)}`;
  const containers: Container[] = [
    { id: `${id}-c1`, code: "C-01", name: "Checked Duffel",  nameZh: "托运行李", type: "checked",  capacityL: 80, maxKg: 23, items: [] },
    { id: `${id}-c2`, code: "C-02", name: "Carry Backpack",  nameZh: "随身背包", type: "carry",    capacityL: 28, maxKg: 10, items: [] },
    { id: `${id}-c3`, code: "C-03", name: "Personal Carry",  nameZh: "随身包",   type: "personal", capacityL: 18, maxKg: 7,  items: [] },
  ];

  if (args.seedFromScenario !== false) {
    const seeds: SeedItem[] = scenarioTemplates[args.scenario] ?? [];
    seeds.forEach((s, idx) => {
      const target =
        containers.find((c) => c.type === (s.pref ?? "checked")) ?? containers[0];
      target.items.push({
        id: `${id}-s${idx}`,
        gearId: null,
        name: s.en,
        nameEn: s.en,
        nameZh: s.zh,
        qty: s.qty ?? 1,
        weightG: s.weightG,
        weightSource: "library",
        category: s.category,
        status: "todo",
        verdict: null,
        utility: null,
        ownership: s.ownership ?? "owned",
      });
    });
  }

  return {
    id,
    title: args.title,
    destinations: args.destinations,
    days: args.days,
    startDate: args.startDate,
    climate: args.climate,
    scenario: args.scenario,
    phase: "PACK",
    containers,
  };
}
