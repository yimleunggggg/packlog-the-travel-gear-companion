// Scenario starter templates — when a user creates a new trip, we seed
// a category-grouped skeleton based on the chosen scenario so they have
// something concrete to fill in (instead of an empty void).
//
// Each template item carries bilingual labels (en + zh).

import type { Item } from "./packlog-data";

export type ScenarioKey =
  | "winter-city" | "summer-beach" | "trail-run" | "alpine"
  | "desert" | "workation" | "ski" | "dive" | "general";

export type SeedItem = {
  en: string;
  zh: string;
  weightG: number;
  category: Item["category"];
  qty?: number;
  ownership?: "owned" | "wishlist" | "undecided";
  // Where to drop it: container *type* the user has
  pref?: "checked" | "carry" | "personal" | "camera";
};

export const scenarioTemplates: Record<ScenarioKey, SeedItem[]> = {
  "winter-city": [
    { en: "Down Parka", zh: "羽绒服", weightG: 720, category: "apparel", pref: "checked" },
    { en: "Merino Baselayer", zh: "美利奴打底", weightG: 210, category: "apparel", qty: 3, pref: "checked" },
    { en: "Beanie", zh: "毛线帽", weightG: 70, category: "apparel", pref: "checked" },
    { en: "Gloves", zh: "手套", weightG: 110, category: "apparel", pref: "checked" },
    { en: "Hand Warmer", zh: "暖宝宝", weightG: 80, category: "misc", qty: 4, pref: "personal" },
    { en: "Lip Balm", zh: "润唇膏", weightG: 12, category: "health", pref: "personal" },
    { en: "Travel Adapter", zh: "电源转换器", weightG: 95, category: "tech", pref: "personal" },
    { en: "Passport", zh: "护照", weightG: 60, category: "doc", pref: "personal" },
  ],
  "summer-beach": [
    { en: "Swimsuit", zh: "泳衣", weightG: 120, category: "apparel", pref: "checked" },
    { en: "Rash Guard UPF50", zh: "防晒衣 UPF50", weightG: 180, category: "apparel", pref: "checked" },
    { en: "Flip-flops", zh: "人字拖", weightG: 220, category: "apparel", pref: "checked" },
    { en: "Sunscreen SPF50", zh: "防晒霜 SPF50", weightG: 110, category: "health", pref: "personal" },
    { en: "Sunglasses", zh: "墨镜", weightG: 35, category: "apparel", pref: "personal" },
    { en: "Quick-dry Towel", zh: "速干毛巾", weightG: 180, category: "misc", pref: "checked" },
    { en: "Snorkel Mask", zh: "浮潜面镜", weightG: 320, category: "misc", ownership: "wishlist", pref: "checked" },
    { en: "Passport", zh: "护照", weightG: 60, category: "doc", pref: "personal" },
  ],
  "trail-run": [
    { en: "Trail Vest 12L", zh: "越野跑包 12L", weightG: 320, category: "misc", pref: "personal" },
    { en: "Trail Runners", zh: "越野跑鞋", weightG: 620, category: "apparel", pref: "checked" },
    { en: "Wind Shell", zh: "风衣", weightG: 90, category: "apparel", pref: "personal" },
    { en: "Soft Flask 500ml", zh: "软水壶 500ml", weightG: 28, category: "misc", qty: 2, pref: "personal" },
    { en: "Energy Gels", zh: "能量胶", weightG: 32, category: "misc", qty: 12, pref: "personal" },
    { en: "Headlamp", zh: "头灯", weightG: 78, category: "tech", pref: "personal" },
    { en: "Emergency Bivvy", zh: "应急睡袋", weightG: 110, category: "health", pref: "personal" },
    { en: "Anti-chafe Balm", zh: "防摩擦膏", weightG: 40, category: "health", pref: "personal" },
  ],
  "alpine": [
    { en: "Gore-Tex Hardshell", zh: "Gore-Tex 硬壳", weightG: 540, category: "apparel", pref: "checked" },
    { en: "Down Mid-layer", zh: "羽绒中层", weightG: 380, category: "apparel", pref: "checked" },
    { en: "Hiking Boots GTX", zh: "GTX 登山靴", weightG: 1100, category: "apparel", pref: "checked" },
    { en: "Trekking Poles", zh: "登山杖", weightG: 480, category: "misc", pref: "checked" },
    { en: "Headlamp", zh: "头灯", weightG: 78, category: "tech", pref: "personal" },
    { en: "Power Bank 20K", zh: "充电宝 20K", weightG: 630, category: "tech", pref: "personal" },
    { en: "Buff", zh: "魔术头巾", weightG: 35, category: "apparel", qty: 2, pref: "personal" },
    { en: "Map / GPS", zh: "地图 / GPS", weightG: 120, category: "tech", pref: "personal" },
  ],
  "desert": [
    { en: "Sun Hoodie UPF50", zh: "防晒长袖 UPF50", weightG: 180, category: "apparel", pref: "checked" },
    { en: "Sand Gaiters", zh: "沙套", weightG: 90, category: "apparel", pref: "checked" },
    { en: "Buff x2", zh: "魔术头巾 ×2", weightG: 35, category: "apparel", qty: 2, pref: "personal" },
    { en: "Sand Goggles", zh: "防沙护目镜", weightG: 65, category: "optic", pref: "personal" },
    { en: "Electrolyte Tabs", zh: "电解质泡腾片", weightG: 110, category: "health", pref: "personal" },
    { en: "SPF50 Sunscreen", zh: "SPF50 防晒霜", weightG: 110, category: "health", pref: "personal" },
    { en: "Soft Flask 1L", zh: "软水壶 1L", weightG: 38, category: "misc", qty: 2, pref: "personal" },
    { en: "Sleeping Bag +5°C", zh: "睡袋 +5°C", weightG: 480, category: "misc", pref: "checked" },
  ],
  "workation": [
    { en: "MacBook", zh: "笔记本电脑", weightG: 1240, category: "tech", pref: "personal" },
    { en: "Travel Adapter", zh: "电源转换器", weightG: 95, category: "tech", pref: "personal" },
    { en: "USB-C Hub", zh: "USB-C 拓展坞", weightG: 90, category: "tech", pref: "personal" },
    { en: "Noise-Cancelling Headphones", zh: "降噪耳机", weightG: 250, category: "tech", pref: "personal" },
    { en: "Compact Mouse", zh: "便携鼠标", weightG: 90, category: "tech", pref: "personal" },
    { en: "Notebook + Pen", zh: "笔记本 + 笔", weightG: 240, category: "doc", pref: "personal" },
    { en: "Smart-casual Shirt", zh: "商务休闲衬衫", weightG: 320, category: "apparel", qty: 3, pref: "checked" },
    { en: "Passport", zh: "护照", weightG: 60, category: "doc", pref: "personal" },
  ],
  "ski": [
    { en: "Ski Jacket", zh: "滑雪服上衣", weightG: 1200, category: "apparel", pref: "checked" },
    { en: "Ski Pants", zh: "滑雪裤", weightG: 980, category: "apparel", pref: "checked" },
    { en: "Ski Goggles", zh: "雪镜", weightG: 180, category: "optic", pref: "personal" },
    { en: "Helmet", zh: "雪盔", weightG: 520, category: "apparel", pref: "checked" },
    { en: "Ski Gloves", zh: "滑雪手套", weightG: 240, category: "apparel", pref: "checked" },
    { en: "Thermal Baselayer", zh: "保暖打底", weightG: 220, category: "apparel", qty: 2, pref: "checked" },
    { en: "Ski Socks", zh: "滑雪袜", weightG: 90, category: "apparel", qty: 3, pref: "checked" },
    { en: "Hand Warmer", zh: "暖宝宝", weightG: 80, category: "misc", qty: 6, pref: "personal" },
    { en: "Lip Balm SPF", zh: "防晒润唇膏", weightG: 12, category: "health", pref: "personal" },
    { en: "GoPro", zh: "GoPro 运动相机", weightG: 153, category: "optic", ownership: "wishlist", pref: "camera" },
  ],
  "dive": [
    { en: "Mask + Snorkel", zh: "面镜 + 呼吸管", weightG: 420, category: "misc", pref: "checked" },
    { en: "Fins", zh: "脚蹼", weightG: 1400, category: "misc", pref: "checked" },
    { en: "Wetsuit 3mm", zh: "潜水服 3mm", weightG: 1800, category: "apparel", pref: "checked" },
    { en: "Dive Computer", zh: "潜水电脑表", weightG: 90, category: "tech", pref: "personal" },
    { en: "Underwater Housing", zh: "水下相机壳", weightG: 1200, category: "optic", ownership: "wishlist", pref: "camera" },
    { en: "Dive Logbook", zh: "潜水日志", weightG: 180, category: "doc", pref: "personal" },
    { en: "Sunscreen Reef-Safe", zh: "珊瑚礁友好防晒", weightG: 90, category: "health", pref: "personal" },
    { en: "Dry Bag 20L", zh: "防水袋 20L", weightG: 280, category: "misc", pref: "checked" },
    { en: "Passport + Cert Card", zh: "护照 + 潜水证", weightG: 75, category: "doc", pref: "personal" },
  ],
  "general": [
    { en: "Passport", zh: "护照", weightG: 60, category: "doc", pref: "personal" },
    { en: "Travel Adapter", zh: "电源转换器", weightG: 95, category: "tech", pref: "personal" },
    { en: "Power Bank 10K", zh: "充电宝 10K", weightG: 220, category: "tech", pref: "personal" },
    { en: "Toiletry Pouch", zh: "洗漱包", weightG: 380, category: "health", pref: "checked" },
    { en: "T-shirts", zh: "T恤", weightG: 180, category: "apparel", qty: 4, pref: "checked" },
    { en: "Underwear", zh: "内裤", weightG: 50, category: "apparel", qty: 5, pref: "checked" },
  ],
};
