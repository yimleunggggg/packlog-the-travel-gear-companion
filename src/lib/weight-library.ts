// Curated weight reference library — averages of common spec / measured samples.
// Used to auto-suggest weight when user adds a custom gear item.
// Matching is fuzzy (contains, case-insensitive) on tokens.

import type { Item } from "./packlog-data";

export type WeightHint = {
  tokens: string[]; // English & Chinese & Japanese tokens
  weightG: number;
  category: Item["category"];
};

export const weightLibrary: WeightHint[] = [
  // Apparel
  { tokens: ["t-shirt", "tee", "tshirt", "t恤", "tシャツ"], weightG: 180, category: "apparel" },
  { tokens: ["jeans", "denim", "牛仔裤", "ジーンズ"], weightG: 620, category: "apparel" },
  { tokens: ["hoodie", "卫衣", "パーカー"], weightG: 540, category: "apparel" },
  { tokens: ["down", "parka", "羽绒", "ダウン"], weightG: 720, category: "apparel" },
  { tokens: ["shell", "gore-tex", "冲锋衣", "シェル"], weightG: 540, category: "apparel" },
  { tokens: ["socks", "袜", "ソックス"], weightG: 60, category: "apparel" },
  { tokens: ["underwear", "内裤", "下着"], weightG: 50, category: "apparel" },
  { tokens: ["baselayer", "merino", "美利奴", "ベースレイヤー"], weightG: 210, category: "apparel" },
  { tokens: ["shoes", "boots", "鞋", "靴"], weightG: 980, category: "apparel" },
  { tokens: ["sandals", "凉鞋", "サンダル"], weightG: 360, category: "apparel" },
  { tokens: ["hat", "cap", "帽", "キャップ"], weightG: 90, category: "apparel" },
  { tokens: ["gloves", "手套", "手袋"], weightG: 110, category: "apparel" },
  { tokens: ["scarf", "围巾", "マフラー"], weightG: 140, category: "apparel" },

  // Tech
  { tokens: ["macbook", "笔记本", "ノートpc", "laptop"], weightG: 1240, category: "tech" },
  { tokens: ["ipad", "tablet", "平板", "タブレット"], weightG: 470, category: "tech" },
  { tokens: ["kindle", "电子书", "電子書籍"], weightG: 174, category: "tech" },
  { tokens: ["airpods", "耳机", "イヤホン", "earbuds"], weightG: 50, category: "tech" },
  { tokens: ["headphones", "headphone", "头戴", "ヘッドホン"], weightG: 250, category: "tech" },
  { tokens: ["charger", "充电器", "充電器", "adapter"], weightG: 120, category: "tech" },
  { tokens: ["power bank", "powerbank", "充电宝", "モバイルバッテリー"], weightG: 360, category: "tech" },
  { tokens: ["cable", "线", "ケーブル"], weightG: 40, category: "tech" },
  { tokens: ["mouse", "鼠标", "マウス"], weightG: 90, category: "tech" },
  { tokens: ["kindle", "switch", "ゲーム機"], weightG: 320, category: "tech" },

  // Optical
  { tokens: ["leica", "q3"], weightG: 743, category: "optic" },
  { tokens: ["sony a7", "α7", "a7c"], weightG: 514, category: "optic" },
  { tokens: ["fuji", "x100"], weightG: 478, category: "optic" },
  { tokens: ["nd filter", "nd滤镜", "ndフィルター"], weightG: 38, category: "optic" },
  { tokens: ["sd card", "sd卡", "sdカード"], weightG: 4, category: "optic" },
  { tokens: ["lens", "镜头", "レンズ"], weightG: 420, category: "optic" },
  { tokens: ["tripod", "三脚架", "三脚"], weightG: 1100, category: "optic" },
  { tokens: ["gimbal", "稳定器", "ジンバル"], weightG: 410, category: "optic" },

  // Docs
  { tokens: ["passport", "护照", "パスポート"], weightG: 60, category: "doc" },
  { tokens: ["wallet", "钱包", "財布"], weightG: 110, category: "doc" },
  { tokens: ["notebook", "笔记本", "ノート"], weightG: 220, category: "doc" },
  { tokens: ["pen", "笔", "ペン"], weightG: 12, category: "doc" },

  // Health
  { tokens: ["toothbrush", "牙刷", "歯ブラシ"], weightG: 18, category: "health" },
  { tokens: ["toothpaste", "牙膏", "歯磨き粉"], weightG: 90, category: "health" },
  { tokens: ["shampoo", "洗发", "シャンプー"], weightG: 200, category: "health" },
  { tokens: ["sunscreen", "防晒", "日焼け止め"], weightG: 110, category: "health" },
  { tokens: ["medicine", "药", "薬"], weightG: 60, category: "health" },
  { tokens: ["mask", "口罩", "マスク"], weightG: 4, category: "health" },
  { tokens: ["towel", "毛巾", "タオル"], weightG: 180, category: "health" },

  // Misc
  { tokens: ["umbrella", "伞", "傘"], weightG: 380, category: "misc" },
  { tokens: ["water bottle", "水瓶", "水筒"], weightG: 280, category: "misc" },
  { tokens: ["hand warmer", "暖宝", "カイロ"], weightG: 80, category: "misc" },
  { tokens: ["snacks", "零食", "おやつ"], weightG: 150, category: "misc" },
  { tokens: ["book", "书", "本"], weightG: 320, category: "misc" },
];

export function suggestFromName(name: string): WeightHint | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  let best: WeightHint | null = null;
  let bestLen = 0;
  for (const h of weightLibrary) {
    for (const tok of h.tokens) {
      if (q.includes(tok.toLowerCase()) && tok.length > bestLen) {
        best = h;
        bestLen = tok.length;
      }
    }
  }
  return best;
}

// Top-N popular suggestions (for the smart-suggest panel)
export const popularSuggestions: { name: string; hint: WeightHint }[] = [
  { name: "Travel Adapter (JP Type-A)", hint: { tokens: [], weightG: 95, category: "tech" } },
  { name: "Hand Warmer", hint: { tokens: [], weightG: 80, category: "misc" } },
  { name: "Microfiber Towel", hint: { tokens: [], weightG: 110, category: "health" } },
  { name: "Power Bank 10K", hint: { tokens: [], weightG: 220, category: "tech" } },
  { name: "Sunglasses", hint: { tokens: [], weightG: 35, category: "apparel" } },
  { name: "Reusable Bottle 500ml", hint: { tokens: [], weightG: 280, category: "misc" } },
];
